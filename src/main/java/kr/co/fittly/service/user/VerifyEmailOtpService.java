package kr.co.fittly.service.user;

import kr.co.fittly.repository.user.UserActionCodeRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.ticket.UserActionCode;
import kr.co.fittly.ticket.UserActionCode.Kind;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerifyEmailOtpService {

    private final UserRepository userRepository;
    private final UserActionCodeRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // 설정값
    private static final Duration EXPIRES_IN = Duration.ofMinutes(10);
    private static final Duration COOLDOWN   = Duration.ofSeconds(60);
    private static final int MAX_DAILY_SENDS = 5;
    private static final int MAX_ATTEMPTS    = 5;

    /** 재전송 쿨다운 예외 (컨트롤러에서 429 처리) */
    public static class CooldownException extends RuntimeException {
        private final long retryAfterSec;
        public CooldownException(long retryAfterSec) {
            super("cooldown");
            this.retryAfterSec = retryAfterSec;
        }
        public long getRetryAfterSec() { return retryAfterSec; }
    }
    /** 일일 한도 초과 예외 (컨트롤러에서 429 처리) */
    public static class DailyLimitException extends RuntimeException {
        public DailyLimitException() { super("daily_limit"); }
    }

    /** OTP 발급 + 메일 전송 성공 시 만료시각 반환 */
    @Transactional
    public Instant sendOtpByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Instant now = Instant.now();

        // 쿨다운
        tokenRepository.findTop1ByUserIdAndTypeOrderByCreatedAtDesc(
                user.getId(), Kind.VERIFY_EMAIL_OTP    // ← 상수명 통일
        ).ifPresent(prev -> {
            Duration elapsed = Duration.between(prev.getCreatedAt(), now);
            if (elapsed.compareTo(COOLDOWN) < 0) {
                long retryAfter = COOLDOWN.minus(elapsed).getSeconds();
                throw new CooldownException(retryAfter);
            }
        });

        // 하루 전송 한도
        Instant todayStartUtc = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        int sentToday = tokenRepository.countByUserIdAndTypeAndCreatedAtAfter(
                user.getId(), Kind.VERIFY_EMAIL_OTP, todayStartUtc
        );
        if (sentToday >= MAX_DAILY_SENDS) throw new DailyLimitException();

        // OTP 생성
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        String hash = passwordEncoder.encode(code);

        UserActionCode t = new UserActionCode();
        t.setUser(user);
        t.setType(Kind.VERIFY_EMAIL_OTP);     // ← 상수명 통일
        t.setToken(hash);
        t.setCreatedAt(now);
        t.setExpiresAt(now.plus(EXPIRES_IN));
        t.setUsedAt(null);
        t.setAttempts(0);
        t = tokenRepository.save(t);

        // 메일 전송(실패 시 방금 토큰 제거)
        String html = """
          <div style="font-family:system-ui,'Apple SD Gothic Neo','Malgun Gothic',sans-serif">
            <h2>이메일 인증번호</h2>
            <p>아래 6자리 코드를 인증 페이지에 입력하세요. 유효기간은 10분입니다.</p>
            <div style="font-size:28px;font-weight:800;letter-spacing:6px">%s</div>
          </div>
        """.formatted(code);

        try {
            emailService.sendHtml(user.getEmail(), "[Fittly] 이메일 인증번호", html);
        } catch (Exception e) {
            tokenRepository.deleteById(t.getId());
            throw new IllegalStateException("send_failed");
        }
        return t.getExpiresAt();
    }

    /** OTP 검증 */
    @Transactional
    public boolean verifyOtp(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        UserActionCode tok = tokenRepository.findTop1ByUserIdAndTypeOrderByCreatedAtDesc(
                user.getId(), Kind.VERIFY_EMAIL_OTP     // ← 상수명 통일
        ).orElseThrow(() -> new IllegalStateException("발급된 인증번호가 없습니다."));

        if (tok.getUsedAt() != null) throw new IllegalStateException("이미 사용된 인증번호입니다.");
        if (Instant.now().isAfter(tok.getExpiresAt())) throw new IllegalStateException("인증번호가 만료되었습니다.");
        if (tok.getAttempts() >= MAX_ATTEMPTS) throw new IllegalStateException("인증 시도 한도를 초과했습니다.");

        boolean ok = passwordEncoder.matches(code, tok.getToken());
        tok.setAttempts(tok.getAttempts() + 1);

        if (ok) {
            tok.setUsedAt(Instant.now());
            user.setEmailVerified(true);
            userRepository.save(user);   // 변경사항 반영
        }
        tokenRepository.save(tok);       // attempts/usedAt 반영
        return ok;
    }
}
