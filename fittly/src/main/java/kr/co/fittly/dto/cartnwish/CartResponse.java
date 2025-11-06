// src/main/java/kr/co/fittly/dto/cartnwish/CartResponse.java
package kr.co.fittly.dto.cartnwish;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import kr.co.fittly.vo.cartnwish.CartItem;
import kr.co.fittly.vo.product.Product;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드는 응답에서 제거
public class CartResponse {

    @JsonProperty("cartItemId")
    private final Long cartItemId;

    @JsonProperty("productId")
    private final Long productId;

    @JsonProperty("productName")
    private final String productName;

    @JsonProperty("brand")
    private final String brand;

    /** ✅ 프런트가 표시에 사용할 "적용가"(할인 적용된 가격) */
    @JsonProperty("price")
    private final Integer price;

    /** 참고용: 원가 / 할인가 원본 */
    @JsonProperty("originalPrice")
    private final Integer originalPrice;

    @JsonProperty("discountPrice")
    private final Integer discountPrice;

    @JsonProperty("thumbnailUrl")
    private final String thumbnailUrl;

    @JsonProperty("quantity")
    private final Integer quantity;

    /** ✅ 선택 옵션 */
    @JsonProperty("color")
    private final String color;

    /** ✅ 표시용 색상 이름 */
    @JsonProperty("colorName")
    private final String colorName;

    @JsonProperty("size")
    private final String size;

    /** ✅ 가용 재고(선택 옵션 기준) */
    @JsonProperty("availableStock")
    private final Integer availableStock;

    /** 프런트 편의: 품절 여부 */
    @JsonProperty("isSoldOut")
    private final Boolean isSoldOut;

    // ------- 생성자들 -------

    /**
     * 내부 기본 생성자: Product에서 가격 계산
     */
    public CartResponse(CartItem ci) {
        this(ci, null, null, null);
    }

    /**
     * 내부 확장 생성자:
     * - appliedPrice: null 이면 Product의 (discountPrice ?? price) 로 계산
     * - availableStock: 옵션/변형 재고(없으면 null 가능)
     * - resolvedColorName: 색상 이름 보정값(없으면 null 가능)
     */
    public CartResponse(CartItem ci, Integer appliedPrice, Integer availableStock, String resolvedColorName) {
        Product p = ci.getProduct();

        Integer origin = safeInt(p.getPrice());
        Integer discount = safeInt(p.getDiscountPrice());
        Integer applied = (appliedPrice != null)
                ? appliedPrice
                : ((discount != null && discount > 0) ? discount : origin);

        this.cartItemId   = ci.getId();
        this.productId    = p.getId();
        this.productName  = p.getName();
        this.brand        = p.getBrand();
        this.price        = applied;
        this.originalPrice = origin;
        this.discountPrice = discount;
        this.thumbnailUrl = p.getThumbnailUrl();
        this.quantity     = ci.getQuantity();

        this.color        = nullIfEmpty(ci.getColor());
        this.colorName    = nullIfEmpty(resolvedColorName);
        this.size         = nullIfEmpty(ci.getSize());

        this.availableStock = availableStock;
        this.isSoldOut      = (availableStock != null) ? (availableStock <= 0) : null;
    }

    // ------- 정적 팩토리 (CartService에서 사용) -------

    /**
     * CartService 가 변형 정보(색상이름/재고/적용가)를 계산해 줄 때 사용하는 팩토리.
     */
    public static CartResponse from(CartItem ci, Integer appliedPrice, Integer availableStock, String colorName) {
        return new CartResponse(ci, appliedPrice, availableStock, colorName);
    }

    // ------- 유틸 -------

    private static Integer safeInt(Integer v) {
        return (v != null && v > 0) ? v : null;
    }

    private static String nullIfEmpty(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
