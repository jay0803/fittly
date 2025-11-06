// src/main/java/kr/co/fittly/dto/payment/PaymentCallbackRequest.java
package kr.co.fittly.dto.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PaymentCallbackRequest {

    /** 아임포트 결제 고유 ID */
    @NotBlank(message = "아임포트 UID는 필수입니다.")
    private String impUid;

    /** 상점(우리) 주문번호(merchantUid) */
    @NotBlank(message = "주문번호는 필수입니다.")
    private String merchantUid;

    /** 프론트가 보낸 총 결제금액(서버가 재계산하여 교차검증) */
    @NotNull(message = "결제 금액은 필수입니다.")
    @Positive(message = "결제 금액은 0보다 커야 합니다.")
    private Integer amount;

    /** 배송지 */
    @NotBlank private String receiverName;
    @NotBlank private String zipcode;
    @NotBlank private String address1;
    private String address2; // 선택 항목
    @NotBlank private String receiverPhone;

    /** 결제 상품 라인업 */
    @NotEmpty(message = "상품 목록은 비어있을 수 없습니다.")
    @Valid
    // [CHANGED] 컨트롤러와 이름을 맞춘 공식 타입
    private List<Product> products;

    // [CHANGED] 공식 타입 (게터/세터 제공)
    @Getter
    @Setter
    public static class Product {

        @NotNull
        private Long productId;

        /** 주문 수량 (최소 1) */
        @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
        private int quantity;

        /** 프론트 표시용 가격(서버는 실제 판매가로 재계산) */
        @Min(value = 0, message = "가격은 0 이상이어야 합니다.")
        private int price;

        /** ✅ 주문 시점 옵션 스냅샷 (선택) */
        @Size(max = 64)
        private String color;       // 코드/키 예: "#000000", "BLACK"

        @Size(max = 128)
        private String colorName;   // 표시용 예: "블랙"

        @Size(max = 64)
        private String size;        // 예: "M", "270"
    }

    // [ADDED][DEPRECATED] 하위 호환용 별칭: 기존 코드(ProductInfo 참조)를 깨지 않도록 유지
    @Deprecated
    public static class ProductInfo extends Product { }
}
