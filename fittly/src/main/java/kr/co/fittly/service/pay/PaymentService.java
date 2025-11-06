// src/main/java/kr/co/fittly/service/pay/PaymentService.java
package kr.co.fittly.service.pay;

import kr.co.fittly.dto.order.OrderResponse;
import kr.co.fittly.dto.payment.PaymentCallbackRequest;
import kr.co.fittly.dto.payment.PaymentReadyResponse;

public interface PaymentService {

    PaymentReadyResponse ready(PaymentCallbackRequest request, String loginId);
    OrderResponse verifyAndProcessPayment(PaymentCallbackRequest request, String loginId);

    /** (선택) PG Webhook 수신 처리 */
    void handleWebhook(String body);
}
