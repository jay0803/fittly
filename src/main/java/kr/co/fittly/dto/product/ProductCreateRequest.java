// src/main/java/kr/co/fittly/dto/product/ProductCreateRequest.java
package kr.co.fittly.dto.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductCreateRequest {

    private String name;
    private String brand;
    /** 카테고리 코드는 Service에서 엔티티 매핑 */
    private String category;

    private Integer price;           // 정가
    private Integer discountPrice;   // 할인가(원)

    /** ✅ 추가: 할인율(%) — 둘 중 하나만 보내도 됨 */
    private Integer discountRate;    // 선호 필드
    private Integer discountPercent; // 하위 호환 필드 (서로 동치로 취급)

    private String description;
    private String material;

    /** 다중 색상 CSV (예: "#000000,#ff0000") */
    private String color;

    /** 옵션: 단일 사이즈 문자열 */
    private String size;

    /** 스타일 코드는 Service에서 엔티티 매핑 */
    private String styleCode;

    private String videoUrl;
    private String tags;

    /** "SALE" | "SOLD_OUT" | "COMING_SOON" */
    private String status;

    /** ISO 형식 날짜 문자열 ("2025-09-22T10:00") */
    private String releaseDate;

    private List<SizeStock> sizes;
    private List<ColorSizes> colorSizes;
    private List<String> imageUrls;

    /* ---------------- Nested DTOs ---------------- */

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SizeStock {
        private String size;
        private Integer stock;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VariantSize {
        private String size;
        private Integer stock;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ColorSizes {
        private String color;
        private String colorName;
        private List<VariantSize> sizes;
    }

    public Product toEntity() {
        // 상태 파싱
        ProductStatus parsedStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                parsedStatus = ProductStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        // 출시일 파싱
        LocalDateTime parsedRelease = null;
        if (releaseDate != null && !releaseDate.isBlank()) {
            try {
                parsedRelease = LocalDateTime.parse(releaseDate.trim());
            } catch (Exception ignored) {}
        }

        // 가격/할인 일관성 보정
        int basePrice = price == null ? 0 : Math.max(0, price);

        // 1) 우선순위: discountRate → discountPercent
        Integer rate = null;
        if (discountRate != null) {
            rate = clamp(discountRate, 0, 100);
        } else if (discountPercent != null) {
            rate = clamp(discountPercent, 0, 100);
        }

        // 2) 할인가 우선 적용(있으면 정가 범위로 클램핑)
        Integer dPrice = discountPrice;
        if (dPrice != null) {
            dPrice = clamp(dPrice, 0, basePrice);
        } else if (rate != null) {
            // 3) 할인가가 없고 할인율이 있으면 역산
            dPrice = Math.round((float) (basePrice * (1 - (rate / 100.0))));
        }

        // 4) 할인율이 없고 할인가만 있으면 할인율 역산
        if (rate == null && dPrice != null && basePrice > 0) {
            double r = (1 - (dPrice / (double) basePrice)) * 100.0;
            rate = clamp((int) Math.round(r), 0, 100);
        }

        return Product.builder()
                .name(name)
                .brand(brand)
                .price(basePrice)
                .discountPrice(dPrice)
                .discountRate(rate)     // ✅ 엔티티에 할인율 저장
                .description(description)
                .material(material)
                .videoUrl(videoUrl)
                .tags(tags)
                .status(parsedStatus)   // null이면 엔티티 @PrePersist에서 SALE로 기본값 처리
                .releaseDate(parsedRelease)
                .salesCount(0)
                .reviewCount(0)
                .build();
    }

    private static Integer clamp(Integer v, int min, int max) {
        if (v == null) return null;
        return Math.min(Math.max(v, min), max);
    }
}
