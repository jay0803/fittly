// src/main/java/kr/co/fittly/service/user/MeService.java
package kr.co.fittly.service.user;

import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class MeService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    /** 비밀번호만 변경 */
    @Transactional
    public void changePassword(String loginId, String current, String next) {
        User u = users.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        // 기존 비밀번호가 없거나 비어있음
        if (u.getPassword() == null || u.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NO_PASSWORD");
        }

        // 현재 비밀번호 불일치
        if (!passwordEncoder.matches(current, u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MISMATCH");
        }

        // 같은 비밀번호로 변경 시도
        if (passwordEncoder.matches(next, u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SAME_PASSWORD");
        }

        // 최소 길이/규칙(필요시 확장)
        if (next == null || next.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD");
        }

        // 저장
        u.setPassword(passwordEncoder.encode(next));
        // JPA 엔티티 변경감지 → 트랜잭션 커밋 시 flush
    }

    /* 필요 없다면 완전히 삭제 권장. 남겨야 한다면 @Deprecated 처리
    @Deprecated
    @Transactional
    public void changeLoginId(String loginId, String newLoginId) {
        if (users.existsByLoginId(newLoginId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "DUPLICATE");
        }
        User u = users.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        u.setLoginId(newLoginId);
    }
    */
}
