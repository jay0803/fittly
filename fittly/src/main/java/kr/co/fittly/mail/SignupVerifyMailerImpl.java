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
public class SignupVerifyMailerImpl implements SignupVerifyMailer {

    private final JavaMailSender mailSender;

    @Override
    public void sendEmailVerifyCode(String toEmail, String code) {
        try {
            MimeMessage mm = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(mm, true, "UTF-8");
            h.setTo(toEmail);
            h.setSubject("[Fittly] 회원가입 이메일 인증코드");
            h.setText("""
                      안녕하세요,

                      회원가입을 위한 이메일 인증코드는 다음과 같습니다.

                      인증코드: %s
                      유효시간: 10분

                      본인이 요청하지 않았다면 이 메일을 무시해 주세요.
                      """.formatted(code), false);
            mailSender.send(mm);
        } catch (Exception e) {
            log.error("회원가입 이메일 인증코드 발송 실패", e);
            throw new IllegalStateException("인증코드 메일 발송에 실패했습니다.");
        }
    }
}
