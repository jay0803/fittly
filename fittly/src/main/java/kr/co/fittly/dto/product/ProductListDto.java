// src/main/java/kr/co/fittly/dto/product/ProductListDto.java
package kr.co.fittly.dto.product;

import java.util.Objects;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.FashionStyle;
import kr.co.fittly.vo.product.ProductCategory;

public class ProductListDto {

    private Long id;
    private String name;
    private Integer price;          // 프로젝트 엔티티 price 타입(int/Integer)에 맞춤
    private String thumbnailUrl;
    private String tags;            // "태그1,태그2,태그3"
    private String categoryCode;    // TOP/BOTTOM/OUTER/SHOES ...
    private String styleCode;       // CASUAL/STREET/VINTAGE ...
    private Integer discountRate;

    public ProductListDto() {}

    /* =============================
       factory method
       ============================= */
    public static ProductListDto from(Product p) {
        if (p == null) return null;

        ProductListDto d = new ProductListDto();
        d.setId(p.getId());
        d.setName(p.getName());
        d.setPrice(p.getPrice());
        d.setThumbnailUrl(p.getThumbnailUrl());
        d.setTags(p.getTags());

        // ManyToOne 매핑을 고려한 안전 접근
        ProductCategory cat = null;
        try { cat = p.getCategory(); } catch (Exception ignored) {}
        d.setCategoryCode(Objects.nonNull(cat) ? cat.getCode() : null);

        FashionStyle st = null;
        try { st = p.getStyle(); } catch (Exception ignored) {}
        d.setStyleCode(Objects.nonNull(st) ? st.getCode() : null);

        try { d.setDiscountRate(p.getDiscountRate()); } catch (Exception ignored) {}

        return d;
    }

    /* =============================
       getters / setters
       ============================= */
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getCategoryCode() { return categoryCode; }
    public void setCategoryCode(String categoryCode) { this.categoryCode = categoryCode; }

    public String getStyleCode() { return styleCode; }
    public void setStyleCode(String styleCode) { this.styleCode = styleCode; }

    public Integer getDiscountRate() { return discountRate; }
    public void setDiscountRate(Integer discountRate) { this.discountRate = discountRate; }
}
