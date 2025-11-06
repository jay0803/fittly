package kr.co.fittly.controller.user;

import kr.co.fittly.dto.user.*;
import kr.co.fittly.service.user.AuthService;
import kr.co.fittly.service.user.UserImageService;
import kr.co.fittly.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(value = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
public class AuthController {

    private final AuthService authService;
    private final UserImageService userImageService;
    private final UserRepository userRepository;

    @Value("${app.frontend.base:http://localhost:3000}")
    private String frontendBase;

    public AuthController(AuthService authService,
                          UserImageService userImageService,
                          UserRepository userRepository) {
        this.authService = authService;
        this.userImageService = userImageService;
        this.userRepository = userRepository;
    }

    @PostMapping(value = "/signup", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<SignupResponse>> signup(@RequestBody SignupRequest request) {
        if (request.getLoginId() == null || request.getLoginId().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("invalid_input"));
        }
        SignupResponse res = authService.signup(request);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping(value = "/signup-mp", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SignupResponse>> signupMultipart(
            @RequestPart("payload") SignupRequest request,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) {
        if (request.getLoginId() == null || request.getLoginId().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("invalid_input"));
        }

        SignupResponse res = authService.signup(request);

        if (photos != null && !photos.isEmpty()) {
            kr.co.fittly.vo.user.User created = userRepository.findByLoginId(request.getLoginId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "user_not_found_after_signup"));
            try {
                userImageService.saveUserPhotos(created.getId(), photos);
            } catch (IOException ioe) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "photo_store_failed", ioe);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse res = authService.login(request);
            return ResponseEntity.ok(ApiResponse.ok(res));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.fail(e.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.fail("invalid_credentials"));
        }
    }

    @PostMapping(value = "/user/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<LoginResponse>> userLogin(@RequestBody LoginRequest request) {
        try {
            LoginResponse res = authService.login(request);
            String role = res.role();
            boolean isUser = role != null && (role.equalsIgnoreCase("USER") || role.equalsIgnoreCase("ROLE_USER"));
            if (!isUser) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail("not_user"));
            return ResponseEntity.ok(ApiResponse.ok(res));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.fail(e.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.fail("invalid_credentials"));
        }
    }

    @PostMapping(value = "/admin/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<LoginResponse>> adminLogin(@RequestBody LoginRequest request) {
        try {
            LoginResponse res = authService.login(request);
            String role = res.role();
            boolean isAdmin = role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("ROLE_ADMIN"));
            if (!isAdmin) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail("not_admin"));
            return ResponseEntity.ok(ApiResponse.ok(res));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(ApiResponse.fail(e.getReason()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.fail("invalid_credentials"));
        }
    }

    @PostMapping(value = {"/password/forgot", "/password/reset-request"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PasswordResetDtos.SimpleResponse>> resetRequest(
            @RequestBody PasswordResetDtos.SendCodeRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok(new PasswordResetDtos.SimpleResponse(true)));
    }

    @PostMapping(value = "/reset-password", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PasswordResetDtos.SimpleResponse>> reset(
            @RequestBody PasswordResetDtos.ConfirmRequest request) {
        authService.performPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok(new PasswordResetDtos.SimpleResponse(true)));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validate(
            @AuthenticationPrincipal User principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("Invalid or expired token"));
        }

        String role = principal.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("ROLE_USER");

        System.out.println("role777::: " + role);

        Map<String, Object> data = Map.of(
                "loginId", principal.getUsername(),
                "role", role
        );

        System.out.println("map555");
        System.out.println(data);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/password/reset-redirect")
    public ResponseEntity<Void> resetRedirect(@RequestParam("token") String token) {
        if (token == null || token.isBlank()) return ResponseEntity.badRequest().build();
        String base = Optional.ofNullable(frontendBase).orElse("http://localhost:3000").replaceAll("/+$", "");
        String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        URI to = URI.create(base + "/auth/reset-password?token=" + encoded);
        return ResponseEntity.status(HttpStatus.FOUND).location(to).build();
    }
}
