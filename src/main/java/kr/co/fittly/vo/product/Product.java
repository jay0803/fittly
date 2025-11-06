package kr.co.fittly.vo.product;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
@Table(name = "product")
public class Product extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 고유 제품 코드 (영문+숫자 12자리, 자동 생성) */
    @Column(name = "product_code", unique = true, length = 12, nullable = false)
    private String productCode;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String brand;

    /** 카테고리 (N:1) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_code", nullable = false)
    @JsonIgnore   // 직렬화 시 순환참조 방지
    private ProductCategory category;

    @Column(nullable = false)
    private int price;

    @Column(name = "discount_price")
    private Integer discountPrice;

    @Column(name = "discount_rate")
    private Integer discountRate;

    @Column(nullable = false)
    private int stock;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    @Lob
    private String description;

    private String material;

    /** 스타일 (N:1) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "style_code", referencedColumnName = "code")
    @JsonIgnore
    private FashionStyle style;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    /** 이미지 URL 리스트(JSON 문자열) */
    @Lob
    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    private String videoUrl;

    private String tags;

    private LocalDateTime releaseDate;

    @Column(nullable = false)
    @Builder.Default
    private int salesCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int reviewCount = 0;

    @Column(precision = 2, scale = 1)
    private BigDecimal averageRating;

    /** 변형 상품 (색상/사이즈별) */
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore   // 변형상품 직렬화 시 순환참조 방지
    private List<ProductVariant> variants = new ArrayList<>();


    /* ==============================
       변형 상품 세팅 + 총 재고 재계산
       ============================== */
    public void setVariantsAndRecalculateTotal(List<ProductVariant> items) {
        this.variants.clear();
        if (items != null) {
            items.forEach(variant -> {
                this.variants.add(variant);
                variant.setProduct(this);
            });
        }
        this.stock = this.variants.stream()
                .mapToInt(ProductVariant::getStock)
                .sum();
    }

    /* ==============================
       엔티티 라이프사이클 콜백
       ============================== */
    @PrePersist
    public void prePersist() {
        if (this.status == null) this.status = ProductStatus.SALE;
        if (this.productCode == null || this.productCode.isBlank()) {
            this.productCode = generateProductCode(); // 12자리 코드 생성
        }
        normalizeDiscount(); // 할인 정보 보정
    }

    @PreUpdate
    public void preUpdate() {
        normalizeDiscount();
    }

    /* ==============================
       내부 유틸: 제품코드 생성
       ============================== */
    private String generateProductCode() {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            int idx = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(idx));
        }
        return sb.toString();
    }

    /* ==============================
       내부 유틸: 할인 보정
       ==============================
       - price 없으면 할인 정보 초기화
       - discountRate 우선 적용, 없으면 discountPrice로 역산
       - 값 범위 클램프 (0~100, 0~price)
    */
    private void normalizeDiscount() {
        Integer p = this.price;
        Integer dp = this.discountPrice;
        Integer dr = this.discountRate;

        if (p == null || p <= 0) {
            this.discountPrice = (dp != null) ? Math.max(0, dp) : null;
            this.discountRate = null;
            return;
        }

        if (dr != null) {
            int r = clamp(dr, 0, 100);
            this.discountRate = r;
            this.discountPrice = Math.max(0, (int) Math.round(p * (100 - r) / 100.0));
            return;
        }

        if (dp != null) {
            int safeDp = clamp(dp, 0, p);
            this.discountPrice = safeDp;
            int r = clamp((int) Math.round((1 - (safeDp / (double) p)) * 100), 0, 100);
            this.discountRate = r;
            return;
        }

        this.discountRate = null;
        this.discountPrice = null;
    }

    private int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }
}
