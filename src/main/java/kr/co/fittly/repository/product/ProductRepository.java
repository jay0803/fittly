// src/main/java/kr/co/fittly/repository/product/ProductRepository.java
package kr.co.fittly.repository.product;

import kr.co.fittly.dto.product.ProductLatestResponse;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    /* =========================
       태그 문자열 전부 수집 (빈값 제외)
       ========================= */
    @Query("select p.tags from Product p where p.tags is not null and trim(p.tags) <> ''")
    List<String> findAllTagStrings();

    /* =========================
       상세 조회 / 고유코드 조회
       ========================= */
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findDetailById(@Param("id") Long id);

    Optional<Product> findByProductCode(String productCode);

    /* =========================
       최신/카테고리 TOP
       (Projection: id, productCode, brand, name, price, discountPrice,
        thumbnailUrl, categoryCode, createdAt)
       ========================= */

    @Query("""
        select new kr.co.fittly.dto.product.ProductLatestResponse(
            p.id,
            p.productCode,
            p.brand,
            p.name,
            p.price,
            p.discountPrice,
            p.thumbnailUrl,
            p.category.code,
            p.createdAt
        )
        from Product p
        order by p.createdAt desc, p.id desc
    """)
    List<ProductLatestResponse> findLatest(Pageable pageable);

    @Query("""
        select new kr.co.fittly.dto.product.ProductLatestResponse(
            p.id,
            p.productCode,
            p.brand,
            p.name,
            p.price,
            p.discountPrice,
            p.thumbnailUrl,
            p.category.code,
            p.createdAt
        )
        from Product p
        where p.category.code = :cat
        order by p.createdAt desc, p.id desc
    """)
    List<ProductLatestResponse> findByCategory(@Param("cat") String categoryCode, Pageable pageable);

    @Query("""
        select new kr.co.fittly.dto.product.ProductLatestResponse(
            p.id,
            p.productCode,
            p.brand,
            p.name,
            p.price,
            p.discountPrice,
            p.thumbnailUrl,
            p.category.code,
            p.createdAt
        )
        from Product p
        where p.category.code = :cat
        order by p.createdAt desc, p.id desc
    """)
    List<ProductLatestResponse> findCategoryTopProducts(@Param("cat") String categoryCode, Pageable pageable);

    @Query("""
        select new kr.co.fittly.dto.product.ProductLatestResponse(
            p.id,
            p.productCode,
            p.brand,
            p.name,
            p.price,
            p.discountPrice,
            p.thumbnailUrl,
            p.category.code,
            p.createdAt
        )
        from Product p
        where p.category.code = :cat
          and p.style is not null
          and p.style.code in :styles
        order by p.createdAt desc, p.id desc
    """)
    List<ProductLatestResponse> findCategoryTopProductsByStyles(
            @Param("cat") String categoryCode,
            @Param("styles") List<String> styleCodes,
            Pageable pageable
    );

    @Query("""
        select new kr.co.fittly.dto.product.ProductLatestResponse(
            p.id,
            p.productCode,
            p.brand,
            p.name,
            p.price,
            p.discountPrice,
            p.thumbnailUrl,
            p.category.code,
            p.createdAt
        )
        from Product p
        where p.category.code = :cat
          and (:excludeIds is null or p.id not in :excludeIds)
        order by p.createdAt desc, p.id desc
    """)
    List<ProductLatestResponse> findCategoryTopProductsExcluding(
            @Param("cat") String categoryCode,
            @Param("excludeIds") List<Long> excludeIds,
            Pageable pageable
    );

    /* =========================
       (관리자) 목록 검색
       - 엔티티 페이지 반환 (Service단에서 DTO 변환)
       ========================= */
    @Query("""
        select p
          from Product p
         where (:q is null or lower(p.name)  like lower(concat('%', :q, '%'))
                        or lower(p.brand) like lower(concat('%', :q, '%')))
           and (:status is null or p.status = :status)
    """)
    Page<Product> search(@Param("q") String q,
                         @Param("status") ProductStatus status,
                         Pageable pageable);

    /* =========================
       통합 검색 (Projection: ProductLatestResponse)
       ========================= */
    @Query(
            value = """
            select new kr.co.fittly.dto.product.ProductLatestResponse(
              p.id,
              p.productCode,
              p.brand,
              p.name,
              p.price,
              p.discountPrice,
              p.thumbnailUrl,
              c.code,
              p.createdAt
            )
            from Product p
            left join p.category c
            where (:q is null
                or lower(p.name)  like lower(concat('%', :q, '%'))
                or lower(p.brand) like lower(concat('%', :q, '%'))
                or (c is not null and (
                      lower(c.code)  like lower(concat('%', :q, '%')) or
                      lower(c.label) like lower(concat('%', :q, '%'))
                   ))
                or (p.tags is not null and lower(p.tags) like lower(concat('%', :q, '%'))))
            order by p.createdAt desc, p.id desc
        """,
            countQuery = """
            select count(p)
            from Product p
            left join p.category c
            where (:q is null
                or lower(p.name)  like lower(concat('%', :q, '%'))
                or lower(p.brand) like lower(concat('%', :q, '%'))
                or (c is not null and (
                      lower(c.code)  like lower(concat('%', :q, '%')) or
                      lower(c.label) like lower(concat('%', :q, '%'))
                   ))
                or (p.tags is not null and lower(p.tags) like lower(concat('%', :q, '%'))))
        """
    )
    Page<ProductLatestResponse> searchUnified(@Param("q") String q, Pageable pageable);

    /* =========================
       태그 검색 (JPQL / Native)
       ========================= */
    @Query("""
        select p
          from Product p
         where p.tags is not null
           and lower(p.tags) like lower(concat('%', :tag, '%'))
    """)
    Page<Product> searchByTag(@Param("tag") String tag, Pageable pageable);

    @Query(
            value = """
            select *
              from product p
             where (:regex is null or p.tags is not null)
               and (:regex is null or lower(p.tags) REGEXP lower(:regex))
             order by p.created_at desc, p.id desc
        """,
            countQuery = """
            select count(*)
              from product p
             where (:regex is null or p.tags is not null)
               and (:regex is null or lower(p.tags) REGEXP lower(:regex))
        """,
            nativeQuery = true
    )
    Page<Product> searchByTagsRegex(@Param("regex") String regex, Pageable pageable);
}
