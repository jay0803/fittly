// src/main/java/kr/co/fittly/repository/order/OrderRepository.java
package kr.co.fittly.repository.order;

import kr.co.fittly.vo.order.Order;
import kr.co.fittly.vo.user.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderUid(String orderUid);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product"})
    @Query("""
           select o
             from Order o
            where o.id   = :orderId
              and o.user = :user
           """)
    Optional<Order> findByIdAndUserWithDetails(@Param("orderId") Long orderId,
                                               @Param("user") User user);
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product"})
    @Query("""
   select o
     from Order o
     left join fetch o.orderItems oi
     left join fetch oi.product p
    where lower(o.orderUid) = lower(:orderUid)
      and o.user = :user
   """)
    Optional<Order> findByOrderUidAndUserFetch(@Param("orderUid") String orderUid,
                                               @Param("user") User user);

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product"})
    @Query("""
           select distinct o
             from Order o
             left join o.orderItems oi
             left join oi.product p
            where o.user = :user
            order by o.createdAt desc, o.id desc
           """)
    List<Order> findByUserWithDetails(@Param("user") User user);

    /** ✅ 주문이 해당 사용자 소유인지 여부 확인 */
    @Query("select count(o) > 0 from Order o where o.orderUid = :orderUid and o.user.id = :userId")
    boolean existsByOrderUidAndUserId(@Param("orderUid") String orderUid,
                                      @Param("userId") Long userId);

    /** ✅ 단순 조회: 사용자와 주문 ID로 */
    Optional<Order> findByIdAndUser(Long id, User user);
}
