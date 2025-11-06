// src/main/java/kr/co/fittly/dto/cartnwish/CartOptionKey.java
package kr.co.fittly.dto.cartnwish;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartOptionKey {
    private Long productId;  // 필수
    private String color;    // null/빈문자 허용 → 서버에서 normalize
    private String size;     // null/빈문자 허용 → 서버에서 normalize
}
