package kr.co.fittly.controller.user;

import jakarta.validation.Valid;
import kr.co.fittly.dto.user.ChangePasswordRequest;
import kr.co.fittly.dto.user.MeResponse;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.repository.user.UserProfileRepository;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class MeController {

    private final UserRepository users;
    private final UserProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public MeResponse me(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        User u = users.findByLoginId(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        MeResponse res = new MeResponse(
                u.getId(),
                u.getLoginId(),
                safe(u.getEmail()),
                safe(u.getName()),
                safe(u.getPhone()),
                resolveCreatedAt(u),
                safe(u.getZipcode()),
                safe(u.getAddress1()),
                safe(u.getAddress2())
        );

        profiles.findById(u.getId()).ifPresent(profile -> {
            res.setHeight(profile.getHeightCm());
            res.setWeight(profile.getWeightKg());
        });

        return res;
    }

    @PutMapping("/account/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void changePassword(Authentication auth,
                               @Valid @RequestBody ChangePasswordRequest req) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        User u = users.findByLoginId(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        if (u.getPassword() == null || u.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NO_PASSWORD");
        }
        if (!passwordEncoder.matches(req.currentPassword(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MISMATCH");
        }
        if (passwordEncoder.matches(req.newPassword(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SAME_PASSWORD");
        }
        if (req.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD");
        }

        u.setPassword(passwordEncoder.encode(req.newPassword()));
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static LocalDateTime resolveCreatedAt(User u) {
        try {
            var m = User.class.getMethod("getCreatedAt");
            Object val = m.invoke(u);
            if (val instanceof LocalDateTime ldt) return ldt;
            if (val instanceof Instant inst) return LocalDateTime.ofInstant(inst, ZoneId.systemDefault());
        } catch (Exception ignored) {}

        for (String m : new String[]{"getRegDate", "getCreated", "getCreatedDate"}) {
            try {
                Object t = User.class.getMethod(m).invoke(u);
                if (t instanceof LocalDateTime ldt) return ldt;
                if (t instanceof Instant inst) return LocalDateTime.ofInstant(inst, ZoneId.systemDefault());
            } catch (Exception ignored) {}
        }
        return null;
    }
}
