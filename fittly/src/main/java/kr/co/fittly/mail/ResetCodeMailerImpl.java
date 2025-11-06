package kr.co.fittly.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ResetCodeMailerImpl implements ResetCodeMailer {

    private final JavaMailSender mailSender;

    @Override
    public void sendPasswordResetCode(String toEmail, String toName, String code) {
        try {
            MimeMessage mm = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(mm, true, "UTF-8");
            h.setTo(toEmail);
            h.setSubject("[Fittly] 비밀번호 재설정 인증코드");
            h.setText("""
                      안녕하세요 %s 님,
                      
                      비밀번호 재설정 인증코드는 아래와 같습니다.
                      
                      인증코드: %s
                      유효시간: 10분
                      
                      본인이 요청하지 않았다면 이 메일을 무시하세요.
                      """.formatted(toName != null ? toName : "", code), false);
            mailSender.send(mm);
        } catch (Exception e) {
            log.error("Failed to send reset code email", e);
            throw new IllegalStateException("메일 발송에 실패했습니다.");
        }
    }
}
