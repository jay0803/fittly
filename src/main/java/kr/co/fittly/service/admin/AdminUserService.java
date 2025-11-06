package kr.co.fittly.service.admin;

import kr.co.fittly.dto.user.UserListItem;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    /** 전체 목록 조회 */
    public Page<UserListItem> listAll(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toItem);
    }

    /** 이름 정확 일치 검색 */
    public Page<UserListItem> listByNameExact(String name, Pageable pageable) {
        return userRepository.findByNameIgnoreCase(name, pageable)
                .map(this::toItem);
    }

    /** 전화번호(숫자만) 부분 일치 검색 */
    public Page<UserListItem> listByPhoneDigits(String digits, Pageable pageable) {
        if (digits == null || digits.isBlank()) {
            return Page.empty(pageable);
        }
        return userRepository.findByPhoneDigitsLike(digits, pageable)
                .map(this::toItem);
    }

    /** User → UserListItem 변환 */
    private UserListItem toItem(User u) {
        return new UserListItem(
                u.getId(),
                u.getName(),
                u.getLoginId(),
                u.getEmail(),
                u.getPhone(),
                u.getRole(),       // ROLE_USER / ADMIN
                u.getCreatedAt()
        );
    }
}
