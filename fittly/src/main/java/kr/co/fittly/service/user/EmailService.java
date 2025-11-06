package kr.co.fittly.service.user;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    /** 보내는 주소(표시용). 설정 없으면 기본값 사용 */
    @Value("${app.mail.from:no-reply@fittly.local}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String fromOrDefault() {
        return (from == null || from.isBlank()) ? "no-reply@fittly.local" : from;
    }

    /** HTML 메일 */
    public void sendHtml(@NonNull String to, @NonNull String subject, @NonNull String htmlBody) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, "UTF-8");
            helper.setFrom(fromOrDefault());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // HTML
            mailSender.send(msg);
        } catch (MessagingException | MailException e) {
            throw new RuntimeException("메일 발송(HTML) 중 오류: " + e.getMessage(), e);
        }
    }

    /** 일반 텍스트 메일 */
    public void sendText(@NonNull String to, @NonNull String subject, @NonNull String text) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, "UTF-8");
            helper.setFrom(fromOrDefault());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, false); // TEXT
            mailSender.send(msg);
        } catch (MessagingException | MailException e) {
            throw new RuntimeException("메일 발송(TEXT) 중 오류: " + e.getMessage(), e);
        }
    }

    /** 과거 호환용 별칭 */
    public void send(@NonNull String to, @NonNull String subject, @NonNull String htmlBody) {
        sendHtml(to, subject, htmlBody);
    }

    /** 비밀번호 재설정 안내(단순 텍스트 버전) */
    public void sendResetMail(@NonNull String to, @NonNull String resetUrl) {
        SimpleMailMessage m = new SimpleMailMessage();
        m.setFrom(fromOrDefault());
        m.setTo(to);
        m.setSubject("[Fittly] 비밀번호 재설정 안내");
        m.setText(String.format(
                """
                안녕하세요.

                아래 링크를 클릭하여 새 비밀번호를 설정하세요.
                %s

                * 링크 유효시간이 지난 경우, 비밀번호 재설정 요청을 다시 진행해주세요.
                본 메일은 발송 전용입니다.
                """,
                resetUrl
        ));
        mailSender.send(m);
    }
}
