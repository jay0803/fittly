package kr.co.fittly.repository.order;

import kr.co.fittly.vo.order.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query("""
           SELECT oi
           FROM OrderItem oi
           JOIN FETCH oi.product p
           WHERE oi.order.id = :orderId
           ORDER BY oi.id ASC
           """)
    List<OrderItem> findByOrderIdWithProduct(@Param("orderId") Long orderId);

    List<OrderItem> findByOrder_Id(Long orderId);

    @Query("""
           SELECT DISTINCT oi
           FROM OrderItem oi
           JOIN FETCH oi.product p
           JOIN FETCH oi.order o
           JOIN FETCH o.user u
           WHERE u.id = :userId
           ORDER BY o.createdAt DESC
           """)
    List<OrderItem> findByUserId(@Param("userId") Long userId);

    @Query("""
           SELECT DISTINCT oi
           FROM OrderItem oi
           JOIN FETCH oi.product p
           JOIN FETCH oi.order o
           JOIN FETCH o.user u
           WHERE u.id = :userId
           AND NOT EXISTS (
               SELECT 1
               FROM Review r
               WHERE r.orderItem = oi
           )
           ORDER BY o.createdAt DESC
           """)
    List<OrderItem> findByUserIdAndReviewIsNull(@Param("userId") Long userId);

    /** ✅ 리뷰 등록 시 사용 - 주문정보까지 함께 가져오기 (orderItem.getOrder() null 방지) */
    @Query("""
           SELECT oi
           FROM OrderItem oi
           JOIN FETCH oi.order o
           WHERE oi.id = :id
           """)
    Optional<OrderItem> findByIdWithOrder(@Param("id") Long id);
}
