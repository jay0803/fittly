package kr.co.fittly.service.user;

import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User u = userRepository.findByLoginId(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));

        // 권한 매핑 (예: "MEMBER", "ADMIN" 등)
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(u.getRole()));
        return org.springframework.security.core.userdetails.User
                .withUsername(u.getLoginId())
                .password(u.getPassword()) // 이미 해시된 값
                .authorities(authorities)
                .accountExpired(false).accountLocked(false).credentialsExpired(false).disabled(false)
                .build();
    }
}
