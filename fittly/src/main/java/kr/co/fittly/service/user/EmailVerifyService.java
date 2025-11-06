// src/main/java/kr/co/fittly/service/user/EmailVerifyService.java
package kr.co.fittly.service.user;

import kr.co.fittly.repository.user.EmailVerifyCodeRepository;
import kr.co.fittly.ticket.EmailVerifyCode;
import kr.co.fittly.exception.TooManyRequestsException;
import kr.co.fittly.dto.user.ApiResponse; // ✅ 실제 경로로 임포트 수정!
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class EmailVerifyService {

    private final EmailVerifyCodeRepository repo;
    private final EmailService emailService;

    @Value("${app.email.verify.expires-minutes:10}")
    private long EXPIRES_MINUTES = 10;

    @Value("${app.email.verify.cooldown-seconds:60}")
    private long COOLDOWN_SECONDS = 60;

    @Value("${app.email.verify.max-daily-sends:5}")
    private int MAX_DAILY_SENDS = 5;

    public record SendReq(String email) {}

    @Transactional
    public ApiResponse<String> sendCode(SendReq req) { // ✅ 반환 타입 교체
        final String email = req.email().trim().toLowerCase();
        final LocalDateTime now = LocalDateTime.now();

        var latest = repo.findTopByEmailOrderByCreatedAtDesc(email).orElse(null);
        if (latest != null) {
            long sec = Duration.between(latest.getCreatedAt(), now).getSeconds();
            if (sec < COOLDOWN_SECONDS) {
                long wait = COOLDOWN_SECONDS - sec;
                throw new TooManyRequestsException("요청이 너무 잦습니다. " + wait + "초 후 다시 시도해 주세요.");
            }
        }

        LocalDateTime windowStart = now.minusHours(24);
        long sent = repo.countByEmailAndCreatedAtAfter(email, windowStart);
        if (sent >= MAX_DAILY_SENDS) {
            throw new TooManyRequestsException("하루 발송 한도를 초과했습니다.");
        }

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));

        EmailVerifyCode ev = new EmailVerifyCode();
        ev.setEmail(email);
        ev.setCode(code);
        ev.setCreatedAt(now);
        ev.setExpiresAt(now.plusMinutes(EXPIRES_MINUTES));
        repo.save(ev);

        String subject = "[Fittly] 이메일 인증번호";
        String html = """
            <p>아래 인증번호를 입력해 주세요.</p>
            <h2 style="letter-spacing:2px">%s</h2>
            <p>유효기간: %d분</p>
        """.formatted(code, EXPIRES_MINUTES);
        emailService.sendHtml(email, subject, html);

        return ApiResponse.ok("인증번호를 전송했습니다."); // ✅ 통일 응답
    }

    @Transactional(readOnly = true)
    public boolean verifyCode(String email, String code) {
        var latest = repo.findTopByEmailOrderByCreatedAtDesc(email.trim().toLowerCase()).orElse(null);
        if (latest == null) return false;
        if (latest.getUsedAt() != null) return false;
        if (latest.getExpiresAt().isBefore(LocalDateTime.now())) return false;
        return latest.getCode().equals(code == null ? "" : code.trim());
    }
}
