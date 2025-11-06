// src/main/java/kr/co/fittly/repository/cartnwish/CartItemRepository.java
package kr.co.fittly.repository.cartnwish;

import kr.co.fittly.vo.cartnwish.Cart;
import kr.co.fittly.vo.cartnwish.CartItem;
import kr.co.fittly.vo.product.Product;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

// [CHANGED] 트랜잭션 어노테이션 추가 (삭제 쿼리 안정성)
// - @Modifying 메서드들이 같은 트랜잭션에서 실행될 수 있도록 보장
import org.springframework.transaction.annotation.Transactional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
    Optional<CartItem> findFirstByCartAndProduct(Cart cart, Product product);
    Optional<CartItem> findByIdAndCart(Long id, Cart cart);
    boolean existsByCartIdAndProductId(Long cartId, Long productId);
    Optional<CartItem> findByCartIdAndProductIdAndColorAndSize(Long cartId, Long productId, String color, String size);

    @Query("""
           select ci from CartItem ci
           where ci.cart.id = :cartId
             and ci.product.id = :productId
             and lower(coalesce(trim(ci.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(ci.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    Optional<CartItem> findByCartIdAndProductIdAndOptionNormalized(
            @Param("cartId") Long cartId,
            @Param("productId") Long productId,
            @Param("color") String color,
            @Param("size") String size
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           select ci from CartItem ci
           where ci.cart = :cart and ci.product = :product
             and lower(coalesce(trim(ci.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(ci.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    Optional<CartItem> findForUpdateByCartProductAndOption(
            @Param("cart") Cart cart,
            @Param("product") Product product,
            @Param("color") String color,
            @Param("size") String size
    );

    @Query("""
           select (count(ci) > 0) from CartItem ci
           where ci.cart.id = :cartId
             and ci.product.id = :productId
             and lower(coalesce(trim(ci.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(ci.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    boolean existsByCartIdAndProductIdAndOptionNormalized(
            @Param("cartId") Long cartId,
            @Param("productId") Long productId,
            @Param("color") String color,
            @Param("size") String size
    );

    @Modifying
    @Transactional // [CHANGED] 삭제 쿼리에 트랜잭션 명시
    @Query("""
           delete from CartItem ci
           where ci.cart.id = :cartId
             and ci.product.id = :productId
             and lower(coalesce(trim(ci.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(ci.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    int deleteByCartIdAndProductIdAndOptionNormalized(
            @Param("cartId") Long cartId,
            @Param("productId") Long productId,
            @Param("color") String color,
            @Param("size") String size
    );


    @Query("select ci from CartItem ci join fetch ci.product p where ci.cart.id = :cartId")
    List<CartItem> findAllWithProductByCartId(@Param("cartId") Long cartId);

    @Modifying
    @Transactional
    @Deprecated
    @Query("delete from CartItem ci where ci.cart.id = :cartId and ci.product.id in :productIds")
    void deleteByCartIdAndProductIdIn(@Param("cartId") Long cartId, @Param("productIds") List<Long> productIds);

    @Transactional
    default int deleteByCartIdAndOptionTuples(Long cartId, List<OptionTuple> tuples) {
        if (tuples == null || tuples.isEmpty()) return 0;
        int total = 0;
        for (OptionTuple t : tuples) {
            if (t == null || t.productId() == null) continue;
            total += deleteByCartIdAndProductIdAndOptionNormalized(
                    cartId, t.productId(), t.color(), t.size()
            );
        }
        return total;
    }

    public static record OptionTuple(Long productId, String color, String size) {}
}
