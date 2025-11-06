package kr.co.fittly.repository.product;

import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    /** 상품 기준 전체 옵션 목록 */
    List<ProductVariant> findByProduct_Id(Long productId);

    /** 상품 삭제 시 옵션 전부 삭제 */
    void deleteByProduct_Id(Long productId);

    /** 색상+사이즈 일치 검색 (대소문자/공백 무시) */
    @Query("""
           select v from ProductVariant v
           where v.product = :product
             and lower(coalesce(trim(v.color), '')) = lower(coalesce(trim(:color), ''))
             and lower(coalesce(trim(v.size ), '')) = lower(coalesce(trim(:size ), ''))
           order by v.id asc
           """)
    Optional<ProductVariant> findFirstByProductAndColorAndSizeNormalized(
            @Param("product") Product product,
            @Param("color") String color,
            @Param("size") String size
    );

    /** 색상만 일치 (사이즈가 null일 때 대비) */
    @Query("""
           select v from ProductVariant v
           where v.product = :product
             and lower(coalesce(trim(v.color), '')) = lower(coalesce(trim(:color), ''))
           order by v.id asc
           """)
    Optional<ProductVariant> findFirstByProductAndColorNormalized(
            @Param("product") Product product,
            @Param("color") String color
    );

    /** color/size 존재 여부에 따라 자동 분기 */
    default Optional<ProductVariant> findFirstByProductAndColorAndMaybeSize(
            Product product, String color, String size
    ) {
        String c = norm(color);
        String s = norm(size);
        if (s == null) {
            return findFirstByProductAndColorNormalized(product, c);
        }
        return findFirstByProductAndColorAndSizeNormalized(product, c, s);
    }

    /** 상품 전체 옵션 재고 합계 */
    @Query("""
           select coalesce(sum(v.stock), 0)
           from ProductVariant v
           where v.product.id = :productId
           """)
    int sumStockByProduct(@Param("productId") Long productId);

    /** 내부 문자열 정규화 */
    private static String norm(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
