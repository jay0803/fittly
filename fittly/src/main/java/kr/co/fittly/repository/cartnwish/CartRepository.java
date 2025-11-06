// src/main/java/kr/co/fittly/repository/cartnwish/CartRepository.java
package kr.co.fittly.repository.cartnwish;

import kr.co.fittly.vo.cartnwish.Cart;
import kr.co.fittly.vo.user.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    /** 일반 조회 */
    Optional<Cart> findByUser(User user);

    /** 사용자 ID로 조회 (편의) */
    @Query("select c from Cart c where c.user.id = :userId")
    Optional<Cart> findByUserId(@Param("userId") Long userId);

    /**
     * 동시성 경합을 줄이기 위한 비관적 락 버전.
     * - 장바구니 생성/아이템 추가가 동시에 들어올 수 있는 구간에서 사용
     * - 서비스에서 필요한 경우에만 호출하세요.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cart c where c.user = :user")
    Optional<Cart> findByUserForUpdate(@Param("user") User user);
}
