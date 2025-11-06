// src/main/java/kr/co/fittly/dto/cartnwish/CartRequest.java
package kr.co.fittly.dto.cartnwish;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 장바구니 담기 요청 DTO
 * - productId: 필수
 * - quantity : 선택(미전달 시 컨트롤러/서비스에서 1로 보정)
 * - color/size: 선택 옵션
 */
@Getter
@Setter
@NoArgsConstructor
public class CartRequest {

    @NotNull(message = "상품 ID는 필수입니다.")
    private Long productId;

    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    private Integer quantity;   // ← Integer로 두어 미전달 가능(서버에서 1로 보정)

    /** 선택 색상 (없으면 null/빈문자 전달 가능) */
    private String color;

    /** 선택 사이즈 (없으면 null/빈문자 전달 가능) */
    private String size;
}
