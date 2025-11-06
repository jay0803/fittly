package kr.co.fittly.controller.user;

import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
public class AuthQueryController {

    private final UserRepository userRepository;

    @GetMapping("/exists")
    public Map<String, Boolean> exists(
            @RequestParam(required = false) String loginId,
            @RequestParam(required = false) String email
    ) {
        boolean idExists = (loginId != null && !loginId.isBlank())
                && userRepository.existsByLoginId(loginId.trim());
        boolean emailExists = (email != null && !email.isBlank())
                && userRepository.existsByEmailIgnoreCase(email.trim());

        return Map.of("loginId", idExists, "email", emailExists);
    }
}
