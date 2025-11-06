package kr.co.fittly.repository.review;

import kr.co.fittly.vo.order.OrderItem;
import kr.co.fittly.vo.review.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** ✅ 상품별 리뷰 조회 (상품상세페이지용 - User, Product, Images 함께 조회) */
    @Query("""
        SELECT DISTINCT r FROM Review r
        JOIN FETCH r.user u
        JOIN FETCH r.product p
        LEFT JOIN FETCH r.images
        WHERE p.id = :productId
        ORDER BY r.createdAt DESC
    """)
    List<Review> findByProductIdFetchJoin(@Param("productId") Long productId);

    /** ✅ 내가 작성한 리뷰 목록 (마이페이지용 - Product, Images, OrderItem 함께 조회) */
    @Query("""
        SELECT DISTINCT r FROM Review r
        JOIN FETCH r.user u
        JOIN FETCH r.product p
        LEFT JOIN FETCH r.orderItem oi
        LEFT JOIN FETCH r.images
        WHERE u.id = :userId
        ORDER BY r.createdAt DESC
    """)
    List<Review> findByUserIdWithOrderItemFetchJoin(@Param("userId") Long userId);

    /** ✅ 해당 주문상품(OrderItem)에 이미 리뷰가 있는지 확인 */
    boolean existsByOrderItem(OrderItem orderItem);
}
