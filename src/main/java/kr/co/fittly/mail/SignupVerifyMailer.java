package kr.co.fittly.mail;

public interface SignupVerifyMailer {
    void sendEmailVerifyCode(String toEmail, String code);
}
