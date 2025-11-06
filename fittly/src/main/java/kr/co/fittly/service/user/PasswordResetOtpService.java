package kr.co.fittly.service.user;

import kr.co.fittly.mail.ResetCodeMailer;
import kr.co.fittly.repository.user.PasswordResetTicketRepository;
import kr.co.fittly.repository.user.UserActionCodeRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.ticket.PasswordResetTicket;
import kr.co.fittly.ticket.UserActionCode;
import kr.co.fittly.ticket.UserActionCode.Kind;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetOtpService {

    private final UserRepository userRepository;
    private final UserActionCodeRepository codeRepo;
    private final PasswordResetTicketRepository ticketRepo;
    private final PasswordEncoder passwordEncoder;
    private final ResetCodeMailer mailer;

    @Value("${app.reset.code.expires-min:10}")  private int EXPIRES_MIN;
    @Value("${app.reset.code.cooldown-sec:60}") private int COOLDOWN_SEC;
    @Value("${app.reset.code.max-daily:5}")     private int MAX_DAILY_SENDS;
    @Value("${app.reset.code.max-attempts:5}")  private int MAX_ATTEMPTS;

    @Transactional
    public void sendCode(String loginId, String email) {
        var user = userRepository.findByLoginId(loginId)
                .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                .orElseThrow(() -> new IllegalArgumentException("아이디/이메일이 일치하지 않습니다."));

        // 최근 발송(쿨다운)
        var last = codeRepo.findTop1ByUserIdAndTypeOrderByCreatedAtDesc(user.getId(), Kind.PASSWORD_RESET).orElse(null);
        if (last != null && last.getCreatedAt().isAfter(Instant.now().minusSeconds(COOLDOWN_SEC))) {
            throw new IllegalStateException("코드는 잠시 후 다시 요청해주세요.");
        }

        // 일일 발송 한도
        int sentToday = codeRepo.countByUserIdAndTypeAndCreatedAtAfter(
                user.getId(), Kind.PASSWORD_RESET, Instant.now().minus(1, ChronoUnit.DAYS));
        if (sentToday >= MAX_DAILY_SENDS) {
            throw new IllegalStateException("하루 발송 한도를 초과했습니다.");
        }

        // 6자리 코드 생성 → token 컬럼에 저장
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));

        var c = new UserActionCode();
        c.setUser(user);
        c.setType(Kind.PASSWORD_RESET);
        c.setToken(code);
        c.setExpiresAt(Instant.now().plus(EXPIRES_MIN, ChronoUnit.MINUTES));
        codeRepo.save(c);

        mailer.sendPasswordResetCode(user.getEmail(), user.getName(), code);
        log.info("Password reset code sent to {} (userId={})", user.getEmail(), user.getId());
    }

    /** 2) 코드 검증 → 1회용 resetToken 발급 */
    @Transactional
    public String verifyCode(String loginId, String email, String code) {
        var user = userRepository.findByLoginId(loginId)
                .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                .orElseThrow(() -> new IllegalArgumentException("아이디/이메일이 일치하지 않습니다."));

        // 입력한 code로 해당 사용자 최신 레코드 찾기(미사용)
        var entry = codeRepo.findFirstByUserIdAndTypeAndTokenAndUsedAtIsNull(user.getId(), Kind.PASSWORD_RESET, code)
                .orElseThrow(() -> new IllegalArgumentException("인증코드가 올바르지 않습니다."));

        if (entry.isExpired()) throw new IllegalStateException("코드가 만료되었습니다.");
        if (entry.getAttempts() >= MAX_ATTEMPTS) throw new IllegalStateException("시도 횟수를 초과했습니다.");

        // (성공 처리) 사용 완료 표시
        entry.markUsed();
        codeRepo.save(entry);

        // 1회용 resetToken 발급 (유효기간 = EXPIRES_MIN)
        var t = new PasswordResetTicket(UUID.randomUUID().toString().replace("-", ""),
                user, LocalDateTime.now().plusMinutes(EXPIRES_MIN));
        ticketRepo.save(t);

        return t.getToken();
    }

    /** 3) 최종 비밀번호 변경 */
    @Transactional
    public void confirm(String resetToken, String newPassword) {
        var t = ticketRepo.findByTokenAndUsedFalse(resetToken)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 요청입니다."));
        if (t.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("요청이 만료되었습니다.");
        }

        var user = t.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        t.markUsed();
        ticketRepo.save(t);

        log.info("Password reset completed (userId={})", user.getId());
    }
}
