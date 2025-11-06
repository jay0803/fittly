package kr.co.fittly.repository.user;

import kr.co.fittly.ticket.UserActionCode;
import kr.co.fittly.ticket.UserActionCode.Kind;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface UserActionCodeRepository extends JpaRepository<UserActionCode, Long> {

    // 최근 1건 (쿨다운 확인용)
    Optional<UserActionCode> findTop1ByUserIdAndTypeOrderByCreatedAtDesc(Long userId, Kind type);

    // 일일 한도 체크
    int countByUserIdAndTypeAndCreatedAtAfter(Long userId, Kind type, Instant after);

    // 검증 시: 해당 코드가 "미사용" 상태인지 확인 (used_at IS NULL)
    Optional<UserActionCode> findFirstByUserIdAndTypeAndTokenAndUsedAtIsNull(Long userId, Kind type, String token);
}
