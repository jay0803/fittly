// src/main/java/kr/co/fittly/security/JwtAuthFilter.java
package kr.co.fittly.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final AntPathMatcher PATHS = new AntPathMatcher();

    // SecurityConfig와 일치(허용 예외 최소화)
    private static final List<String> EXCLUDED_PATHS = List.of(
            "/api/pay/webhook"
    );

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Value("${security.jwt.use-token-authorities:false}")
    private boolean useTokenAuthorities;

    public JwtAuthFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /** 특정 경로는 아예 필터를 적용하지 않음 */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        final String path = request.getRequestURI();
        for (String p : EXCLUDED_PATHS) {
            if (PATHS.match(p, path)) return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest req,
            @NonNull HttpServletResponse res,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        // CORS preflight 통과
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        final String token = resolveToken(req);
        if (token == null || !jwtUtil.isTokenValid(token)) {
            chain.doFilter(req, res);
            return;
        }

        // 이미 인증된 상태면 패스
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(req, res);
            return;
        }

        final String username = jwtUtil.extractUsername(token);
        if (username == null || username.isBlank()) {
            chain.doFilter(req, res);
            return;
        }

        UserDetails principal;
        if (useTokenAuthorities) {
            final String role = jwtUtil.extractRole(token);
            Collection<? extends GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));
            principal = new User(username, "", authorities);
        } else {
            // DB 조회 실패 시 JWT role fallback
            try {
                principal = userDetailsService.loadUserByUsername(username);
            } catch (Exception e) {
                final String role = jwtUtil.extractRole(token);
                Collection<? extends GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));
                principal = new User(username, "", authorities);
            }
        }

        var authToken = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));

        // 컨트롤러에서 userId 사용 편의 제공
        Long userId = jwtUtil.extractUserId(token);
        if (userId != null) {
            req.setAttribute("AUTH_USER_ID", userId);
        }

        SecurityContextHolder.getContext().setAuthentication(authToken);
        chain.doFilter(req, res);
    }

    /** Authorization, X-Auth-Token, Cookie(AUTH/Authorization) 순으로 토큰 해석 */
    private String resolveToken(HttpServletRequest req) {
        // 1) Authorization 헤더
        String header = req.getHeader("Authorization");
        String fromHeader = jwtUtil.stripBearer(header);
        if (notBlank(fromHeader)) return fromHeader;

        // 2) X-Auth-Token 헤더(프록시/특정 서버 환경)
        String x = req.getHeader("X-Auth-Token");
        if (notBlank(x)) return x.trim();

        // 3) 쿠키
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (c == null) continue;
                String name = c.getName();
                if ("AUTH".equalsIgnoreCase(name) || "Authorization".equalsIgnoreCase(name)) {
                    String v = jwtUtil.stripBearer(c.getValue());
                    if (notBlank(v)) return v;
                }
            }
        }
        return null;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.trim().isEmpty();
    }
}
