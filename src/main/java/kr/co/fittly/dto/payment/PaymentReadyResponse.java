// src/main/java/kr/co/fittly/dto/payment/PaymentReadyResponse.java
package kr.co.fittly.dto.payment;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PaymentReadyResponse {
    private final String merchantUid;   // 예: ORD-20251014-XXXX
    private final int amount;           // 서버가 계산한 최종 결제 금액(할인가*수량 합)
    private final List<Long> cartItemIds; // 결제 대상 장바구니 아이템들(선택 항목)
    private final String pgProvider;    // 화면에서 쓰려면 그대로 전달
    private final String payMethod;     // 화면에서 쓰려면 그대로 전달
}
