// src/main/java/kr/co/fittly/service/FindIdService.java
package kr.co.fittly.service.user;

import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FindIdService {

    private final UserRepository userRepository;

    private static final String EMAIL_RULE = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    @Transactional(readOnly = true)
    public List<String> lookupIds(String name, String email) {
        if (email == null || !email.matches(EMAIL_RULE)) {
            throw new IllegalArgumentException("올바른 이메일을 입력하세요.");
        }
        final String e = email.trim();

        List<User> users;
        if (name != null && !name.isBlank()) {
            users = userRepository.findAllByNameAndEmailIgnoreCase(name.trim(), e);
            if (users.isEmpty()) {
                users = userRepository.findAllByEmailIgnoreCase(e);
            }
        } else {
            users = userRepository.findAllByEmailIgnoreCase(e);
        }
        return users.stream().map(User::getLoginId).distinct().toList();
    }
}
