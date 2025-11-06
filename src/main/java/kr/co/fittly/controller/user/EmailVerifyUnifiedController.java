package kr.co.fittly.controller.user;

import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.dto.user.EmailCodeSendRequest;
import kr.co.fittly.dto.user.EmailCodeVerifyRequest;
import kr.co.fittly.service.user.AuthService;
import kr.co.fittly.service.user.VerifyEmailOtpService;
import kr.co.fittly.service.user.VerifyEmailOtpService.CooldownException;
import kr.co.fittly.service.user.VerifyEmailOtpService.DailyLimitException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/auth/email-verify", produces = MediaType.APPLICATION_JSON_VALUE)
public class EmailVerifyUnifiedController {

    private final AuthService authService;
    private final VerifyEmailOtpService otpService;

    @PostMapping(value = "/code/request", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<String>> requestCode(@RequestBody EmailCodeSendRequest req) {
        try {
            authService.requestSignupEmailCode(req);
            return ResponseEntity.ok(ApiResponse.ok("인증코드를 전송했습니다."));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.fail(e.getReason()));
        }
    }

    @PostMapping(value = "/code/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<String>> verifyCode(@RequestBody EmailCodeVerifyRequest req) {
        try {
            authService.verifySignupEmailCode(req);
            return ResponseEntity.ok(ApiResponse.ok("이메일 인증이 완료되었습니다."));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.fail(e.getReason()));
        }
    }


    @PostMapping(value = "/otp/send", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("email_required"));
        }
        try {
            Instant expiresAt = otpService.sendOtpByEmail(email);
            long expiresSec   = Math.max(0, Duration.between(Instant.now(), expiresAt).getSeconds());
            Map<String,Object> data = Map.of("cooldownSec", 60, "expiresSec", expiresSec);
            return ResponseEntity.ok(ApiResponse.ok(data));
        } catch (CooldownException e) {
            HttpHeaders h = new HttpHeaders();
            h.add(HttpHeaders.RETRY_AFTER, String.valueOf(e.getRetryAfterSec()));
            return ResponseEntity.status(429).headers(h)
                    .body(ApiResponse.fail("cooldown"));
        } catch (DailyLimitException e) {
            return ResponseEntity.status(429).body(ApiResponse.fail("daily_limit"));
        } catch (IllegalArgumentException e) { // no_user 등
            return ResponseEntity.badRequest().body(ApiResponse.fail("no_user"));
        } catch (IllegalStateException e) {    // send_failed 등
            return ResponseEntity.status(502).body(ApiResponse.fail("send_failed"));
        }
    }

    @PostMapping(value = "/otp/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code  = body.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("invalid_input"));
        }
        try {
            boolean ok = otpService.verifyOtp(email, code);
            return ok ? ResponseEntity.ok(ApiResponse.ok(true))
                    : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("mismatch"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
