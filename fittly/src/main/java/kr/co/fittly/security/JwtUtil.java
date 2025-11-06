// src/main/java/kr/co/fittly/security/JwtUtil.java
package kr.co.fittly.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secretBase64;  // Base64 인코딩된 32바이트(256bit) 이상

    @Value("${app.jwt.expiration-ms:86400000}")
    private long expirationMs;    // 기본 1일

    @Value("${app.jwt.clock-skew-sec:60}")
    private long clockSkewSec;    // 서버간 시차 허용(기본 60초)

    private Key signingKey;       // 서명 키

    @PostConstruct
    void init() {
        if (secretBase64 == null || secretBase64.isBlank()) {
            throw new IllegalStateException("JWT secret(app.jwt.secret)이 비어있습니다. Base64 인코딩된 32바이트(256bit) 이상 값을 설정하세요.");
        }
        final byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretBase64);
        } catch (Exception e) {
            throw new IllegalStateException("JWT secret(app.jwt.secret) Base64 디코딩 실패: " + e.getMessage(), e);
        }
        if (keyBytes.length < 32) {
            log.warn("JWT secret length is weak ({} bytes). Use >= 32 bytes (256-bit).", keyBytes.length);
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /* ==================== 토큰 발급 ==================== */
    public String generateToken(Long userId, String loginId, String role) {
        if (role == null || role.isBlank()) role = "ROLE_USER";
        if (!role.startsWith("ROLE_")) role = "ROLE_" + role.toUpperCase();

        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(loginId)
                .claim("uid", userId)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /* ==================== 검증/추출 ==================== */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.info("JWT expired: {}", e.getMessage());
        } catch (UnsupportedJwtException | MalformedJwtException | SecurityException e) {
            log.warn("JWT invalid: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT empty/illegal: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT validation unexpected error", e);
        }
        return false;
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        String role = parseClaims(token).get("role", String.class);
        if (role == null || role.isBlank()) return "ROLE_USER";
        return role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
    }

    public Long extractUserId(String token) {
        Object uid = parseClaims(token).get("uid");
        if (uid instanceof Number) return ((Number) uid).longValue();
        if (uid instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    /* ==================== 내부 ==================== */
    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .setAllowedClockSkewSeconds(clockSkewSec)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /* ==================== 유틸 ==================== */
    public String stripBearer(String headerValue) {
        if (headerValue == null) return null;
        String v = headerValue.trim();
        return v.startsWith("Bearer ") ? v.substring(7).trim() : v;
    }
}
