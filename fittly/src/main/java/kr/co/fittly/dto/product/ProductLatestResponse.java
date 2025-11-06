// src/main/java/kr/co/fittly/dto/product/ProductLatestResponse.java
package kr.co.fittly.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.fittly.vo.product.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductLatestResponse {

    private Long id;
    private String productCode;
    private String brand;
    private String name;
    private Integer price;
    private Integer discountPrice;
    private String thumbnailUrl;
    private String category;        // 코드값 (예: "OUTER")
    private String categoryLabel;   // 라벨  (예: "아우터")
    private LocalDateTime createdAt;

    public ProductLatestResponse(Long id,
                                 String productCode,
                                 String brand,
                                 String name,
                                 Integer price,
                                 Integer discountPrice,
                                 String thumbnailUrl,
                                 String category,
                                 LocalDateTime createdAt) {
        this.id = id;
        this.productCode = productCode;
        this.brand = brand;
        this.name = name;
        this.price = price;
        this.discountPrice = discountPrice;
        this.thumbnailUrl = thumbnailUrl;
        this.category = category;
        this.createdAt = createdAt;
    }

    public static ProductLatestResponse fromEntity(Product p) {
        if (p == null) return null;
        return ProductLatestResponse.builder()
                .id(p.getId())
                .productCode(p.getProductCode())
                .brand(p.getBrand())
                .name(p.getName())
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .thumbnailUrl(p.getThumbnailUrl())
                .category(p.getCategory() != null ? p.getCategory().getCode() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }

    /** categoryLabel 포함 변환 */
    public static ProductLatestResponse fromEntity(Product p, String categoryLabel) {
        if (p == null) return null;
        return ProductLatestResponse.builder()
                .id(p.getId())
                .productCode(p.getProductCode())
                .brand(p.getBrand())
                .name(p.getName())
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .thumbnailUrl(p.getThumbnailUrl())
                .category(p.getCategory() != null ? p.getCategory().getCode() : null)
                .categoryLabel(categoryLabel)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
