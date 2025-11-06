// src/main/java/kr/co/fittly/repository/cartnwish/WishlistRepository.java
package kr.co.fittly.repository.cartnwish;

import kr.co.fittly.vo.cartnwish.Wishlist;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.user.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    /** 사용자 전체 목록 (상품까지 미리 로딩) */
    @Query("""
           select w from Wishlist w
           join fetch w.product p
           where w.user = :user
           order by w.createdAt desc
           """)
    List<Wishlist> findByUserOrderByCreatedAtDesc(@Param("user") User user);

    /** (레거시) 옵션 미포함 존재 여부/조회 — 기존 코드 호환용 */
    boolean existsByUserAndProduct(User user, Product product);
    Optional<Wishlist> findFirstByUserAndProduct(User user, Product product);

    // ─────────────────────────────────────────────────────────────────────
    // ✅ 신규(권장): 파생 쿼리 메서드로 단순화
    //    - (user, product, color, size) 기준으로만 비교
    //    - 대/소문자 무시(IgnoreCase)  // [NEW] 파생 메서드로 간결/안전
    //    - 엔티티 @PrePersist에서 trim/empty→null 정규화가 이뤄지므로 여기선 별도 coalesce 불필요
    // ─────────────────────────────────────────────────────────────────────

    /** [NEW] (user, product, color, size) 기준 존재 여부 — 대소문자 무시 */
    boolean existsByUserAndProductAndColorIgnoreCaseAndSizeIgnoreCase(
            User user, Product product, String color, String size
    );

    /** [NEW] (user, product, color, size) 기준 단건 조회 — 대소문자 무시 */
    Optional<Wishlist> findFirstByUserAndProductAndColorIgnoreCaseAndSizeIgnoreCase(
            User user, Product product, String color, String size
    );

    // ─────────────────────────────────────────────────────────────────────
    // (선택 유지) JPQL 버전
    //  - 기존 호출부가 있다면 그대로 동작
    //  - 신규 개발은 위의 파생 메서드 사용 권장  // [NOTE]
    // ─────────────────────────────────────────────────────────────────────

    /** (user, product, color, size) 기준 존재 여부 — JPQL(대소문자/공백 내구성) */
    @Query("""
           select (count(w) > 0) from Wishlist w
           where w.user = :user
             and w.product = :product
             and lower(coalesce(trim(w.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(w.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    boolean existsByUserProductAndColorSize(
            @Param("user") User user,
            @Param("product") Product product,
            @Param("color") String color,
            @Param("size") String size
    );

    /** (user, product, color, size) 기준 단건 조회 — JPQL(대소문자/공백 내구성) */
    @Query("""
           select w from Wishlist w
           where w.user = :user
             and w.product = :product
             and lower(coalesce(trim(w.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(w.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    Optional<Wishlist> findFirstByUserProductAndColorSize(
            @Param("user") User user,
            @Param("product") Product product,
            @Param("color") String color,
            @Param("size") String size
    );

    // ─────────────────────────────────────────────────────────────────────
    // (레거시) 색상이름까지 포함한 비교 — 기존 호출부 호환용으로 남겨둠
    //  - 신규 개발에서는 colorName은 '표시용'이므로 비교에서 제외하는 것을 권장  // [NOTE]
    // ─────────────────────────────────────────────────────────────────────
    @Query("""
           select (count(w) > 0) from Wishlist w
           where w.user = :user
             and w.product = :product
             and lower(coalesce(trim(w.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(w.colorName), '')) = lower(coalesce(trim(:colorName), ''))
             and lower(coalesce(trim(w.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    boolean existsByUserProductAndOption(
            @Param("user") User user,
            @Param("product") Product product,
            @Param("color") String color,
            @Param("colorName") String colorName,
            @Param("size") String size
    );

    @Query("""
           select w from Wishlist w
           where w.user = :user
             and w.product = :product
             and lower(coalesce(trim(w.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(w.colorName), '')) = lower(coalesce(trim(:colorName), ''))
             and lower(coalesce(trim(w.size ), '')) = lower(coalesce(trim(:size ), ''))
           """)
    Optional<Wishlist> findFirstByUserProductAndOption(
            @Param("user") User user,
            @Param("product") Product product,
            @Param("color") String color,
            @Param("colorName") String colorName,
            @Param("size") String size
    );
}
