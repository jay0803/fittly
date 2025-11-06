package kr.co.fittly.controller.user;

import kr.co.fittly.repository.user.UserImageRepository;
import kr.co.fittly.repository.user.UserProfileRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserAiContextController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserImageRepository userImageRepository;

    @GetMapping("/ai-context")
    public Map<String,Object> aiContext(@AuthenticationPrincipal UserDetails principal) {
        Map<String,Object> m = new LinkedHashMap<>();
        if (principal == null) return m;

        User me = userRepository.findByLoginId(principal.getUsername()).orElse(null);
        m.put("user", me);

        var prof = me != null ? userProfileRepository.findByUserId(me.getId()).orElse(null) : null;
        m.put("profile", prof);

        var images = me != null ? userImageRepository.findAllByUserIdOrderByIdDesc(me.getId()) : List.of();
        m.put("images", images);
        m.put("prefCats", List.of("top","outer"));
        m.put("prefStyles", List.of("스트릿","캐주얼"));

        return m;
    }
}
