package kr.co.fittly.dto.user;

public record EmailCodeVerifyRequest(String email, String code) {}