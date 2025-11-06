// src/main/java/kr/co/fittly/dto/cartnwish/WishlistResponse.java
package kr.co.fittly.dto.cartnwish;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import kr.co.fittly.vo.cartnwish.Wishlist;
import kr.co.fittly.vo.product.Product;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
// [NEW] 화면 표기를 위해 소문자 키를 보기 좋게 변환(예: 대문자화)하는 용도로 Locale 사용
import java.util.Locale;

/**
 * Wishlist 응답 DTO
 * - null/빈 문자열 안전 처리
 * - color/colorName/size 옵션 포함
 * - displayColor(색상이름 우선, 없으면 색상코드의 보기 좋은 표기) 제공 // [NEW] colorName 없을 때 color 키를 보기 좋게 변환해 노출
 * - 할인 가격(discountPrice) 및 effectivePrice(노출가) 포함
 * - 썸네일 없을 때 기본 이미지 보장
 */
@Getter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WishlistResponse {

    @JsonProperty("wishlistId")
    private Long wishlistId;

    @JsonProperty("productId")
    private Long productId;

    @JsonProperty("productName")
    private String productName;

    @JsonProperty("brand")
    private String brand;

    /** 정가 */
    @JsonProperty("price")
    private Integer price;

    /** 할인 가격(없으면 null) */
    @JsonProperty("discountPrice")
    private Integer discountPrice;

    /** 화면 노출용 가격(할인 있으면 할인가, 아니면 정가) */
    @JsonProperty("effectivePrice")
    private Integer effectivePrice;

    @JsonProperty("thumbnailUrl")
    private String thumbnailUrl;

    /** 선택 옵션 */
    @JsonProperty("color")
    private String color;         // 색상 코드/키(엔티티는 소문자 정규화 가능성)

    /** 표시용 색상 이름 (예: Deep Green) */
    @JsonProperty("colorName")
    private String colorName;

    /** UI 편의: 색상이름 우선, 없으면 색상코드를 보기 좋게 표기(대문자) */
    @JsonProperty("displayColor")
    private String displayColor;  // [NEW] colorName 부재 시 color 키를 toDisplayKey로 변환해 사용

    @JsonProperty("size")
    private String size;          // 사이즈 키(엔티티는 소문자 정규화 가능성)

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    public WishlistResponse(Wishlist w) {
        if (w == null) return;

        this.wishlistId = w.getId();
        this.createdAt  = w.getCreatedAt();

        // 옵션(빈문자 → null)
        this.color     = nzOrNull(w.getColor());      // 키(소문자일 수 있음)
        this.colorName = nzOrNull(w.getColorName());  // 표시용(대소문자 보존)
        this.size      = nzOrNull(w.getSize());       // 키(소문자일 수 있음)

        // [NEW] displayColor 계산 방식 변경:
        //      1) colorName이 있으면 우선 사용
        //      2) 없으면 color 키를 보기 좋게 변환(대문자 등)하여 사용
        this.displayColor = firstNonEmpty(this.colorName, toDisplayKey(this.color)); // [NEW]

        Product p = w.getProduct();
        if (p != null) {
            this.productId      = p.getId();
            this.productName    = nz(p.getName());
            this.brand          = nz(p.getBrand());
            this.price          = p.getPrice();
            this.discountPrice  = p.getDiscountPrice();
            this.effectivePrice = calcEffectivePrice(p.getPrice(), p.getDiscountPrice());

            String thumb = p.getThumbnailUrl();
            this.thumbnailUrl = (thumb == null || thumb.isBlank())
                    ? "/images/placeholder.png"
                    : thumb;
        } else {
            // product가 null인 레거시 데이터라도 DTO는 안전
            this.productName    = "";
            this.brand          = "";
            this.thumbnailUrl   = "/images/placeholder.png";
            this.effectivePrice = null;
        }
    }

    // ───────────── 유틸 ─────────────
    private static String nz(String s) { return s == null ? "" : s; }

    private static String nzOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** a가 비었으면 b 반환 */
    private static String firstNonEmpty(String a, String b) {
        String aa = nzOrNull(a);
        if (aa != null) return aa;
        return nzOrNull(b);
    }

    /**
     * [NEW] 키를 화면표시용으로 변환
     *  - colorName이 없을 때 color 키를 그대로 노출하면 'black'처럼 밋밋하거나 케이스가 들쭉날쭉할 수 있음
     *  - 기본 정책: 전부 대문자 변환(예: black → BLACK, ivory → IVORY)
     *  - 필요 시 이 함수를 커스터마이징(스네이크/케밥 → 스페이스 등) 해도 됨
     */
    private static String toDisplayKey(String key) { // [NEW]
        if (key == null) return null;
        String t = key.trim();
        return t.isEmpty() ? null : t.toUpperCase(Locale.ROOT);
    }

    private static Integer calcEffectivePrice(Integer price, Integer discountPrice) {
        if (discountPrice != null) {
            try {
                int p = (price == null) ? 0 : price;
                int d = discountPrice;
                if (d > 0 && (p == 0 || d < p)) return d;
            } catch (Exception ignored) {}
        }
        return price;
    }
}
