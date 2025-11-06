package kr.co.fittly.controller.user;

import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.dto.user.PasswordResetDtos;
import kr.co.fittly.service.user.PasswordResetOtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value="/api/auth/password-reset", produces=MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetOtpService service;

    @PostMapping(value = "/code/request", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PasswordResetDtos.SimpleResponse>> send(
            @RequestBody PasswordResetDtos.SendCodeRequest req) {
        service.sendCode(req.loginId(), req.email());
        return ResponseEntity.ok(ApiResponse.ok(new PasswordResetDtos.SimpleResponse(true)));
    }

    @PostMapping(value = "/code/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PasswordResetDtos.VerifyResponse>> verify(
            @RequestBody PasswordResetDtos.VerifyCodeRequest req) {
        String token = service.verifyCode(req.loginId(), req.email(), req.code());
        return ResponseEntity.ok(ApiResponse.ok(new PasswordResetDtos.VerifyResponse(true, token)));
    }

    @PostMapping(value = "/confirm", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PasswordResetDtos.SimpleResponse>> confirm(
            @RequestBody PasswordResetDtos.ConfirmRequest req) {
        service.confirm(req.resetToken(), req.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(new PasswordResetDtos.SimpleResponse(true)));
    }
}
