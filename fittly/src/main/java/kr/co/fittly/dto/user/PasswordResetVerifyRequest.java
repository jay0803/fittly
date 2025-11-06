package kr.co.fittly.dto.user;

public record PasswordResetVerifyRequest(String loginId, String email, String code) {}
