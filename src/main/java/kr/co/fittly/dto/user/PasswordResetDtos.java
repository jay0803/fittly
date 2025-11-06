package kr.co.fittly.dto.user;

public class PasswordResetDtos {

    // --- 요청(Request) DTOs ---
    public record SendCodeRequest(String loginId, String email) {}
    public record VerifyCodeRequest(String loginId, String email, String code) {}
    public record ConfirmRequest(String resetToken, String newPassword) {}

    // --- 응답(Response) DTOs ---
    public record SimpleResponse(boolean success) {}
    public record VerifyResponse(boolean success, String resetToken) {}
}