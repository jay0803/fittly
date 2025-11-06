// src/main/java/kr/co/fittly/dto/order/OrderResponse.java
package kr.co.fittly.dto.order;

import com.fasterxml.jackson.annotation.JsonFormat;
import kr.co.fittly.vo.order.Order;
import kr.co.fittly.vo.order.OrderItem;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public class OrderResponse {
    private final Long orderId;
    private final String orderUid;
    private final String impUid;        // PG UID(표시/추적용)
    private final String status;        // PAID, PREPARING, ...
    private final int totalAmount;      // 주문 총액

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private final LocalDateTime orderDate;

    private final int itemCount;        // 품목 수
    private final List<OrderItemResponse> items;

    // ▼ 배송지 스냅샷 (PayAddress)
    private final String receiverName;
    private final String zipcode;
    private final String address1;
    private final String address2;
    private final String receiverPhone;

    public OrderResponse(Order order) {
        this.orderId     = order.getId();
        this.orderUid    = order.getOrderUid();
        this.impUid      = order.getImpUid();
        this.status      = order.getStatus().name();
        this.totalAmount = order.getAmount();
        this.orderDate   = order.getCreatedAt();

        List<OrderItem> srcItems = order.getOrderItems() != null
                ? order.getOrderItems()
                : Collections.emptyList();

        this.itemCount = srcItems.size();
        this.items = srcItems.stream()
                .map(OrderItemResponse::new)  // ← 여기서 color/colorName/size까지 내려가도록 OrderItemResponse가 구현돼 있어야 합니다.
                .collect(Collectors.toList());

        var a = order.getAddress();
        if (a != null) {
            this.receiverName  = a.getReceiverName();
            this.zipcode       = a.getZipcode();
            this.address1      = a.getAddress1();
            this.address2      = a.getAddress2();
            this.receiverPhone = a.getReceiverPhone();
        } else {
            this.receiverName  = null;
            this.zipcode       = null;
            this.address1      = null;
            this.address2      = null;
            this.receiverPhone = null;
        }
    }
}
