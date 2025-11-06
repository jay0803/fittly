package kr.co.fittly.mail;

public interface ResetCodeMailer {
    void sendPasswordResetCode(String toEmail, String toName, String code);
}
