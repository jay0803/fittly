package kr.co.fittly.dto.payment;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

// PaymentData.java
@Getter
@Builder
public class PaymentData {
    private String impUid;
    private String merchantUid;
    private int amount;

    private String loginId;

    private String receiverName;
    private String zipcode;
    private String address1;
    private String address2;
    private String receiverPhone;

    // ✅ ProductInfo → Product 로 변경
    private List<PaymentCallbackRequest.Product> products;

    public static PaymentData from(PaymentCallbackRequest request, JsonNode paymentInfo, String loginId) {
        return PaymentData.builder()
                .impUid(request.getImpUid())
                .merchantUid(request.getMerchantUid())
                .amount(paymentInfo.get("amount").asInt())
                .loginId(loginId)
                .receiverName(request.getReceiverName())
                .zipcode(request.getZipcode())
                .address1(request.getAddress1())
                .address2(request.getAddress2())
                .receiverPhone(request.getReceiverPhone())
                // ✅ 타입 일치
                .products(request.getProducts())
                .build();
    }
}
