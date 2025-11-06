// src/main/java/kr/co/fittly/dto/order/OrderSummaryResponse.java
package kr.co.fittly.dto.order;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.fittly.vo.order.Order;
import kr.co.fittly.vo.order.OrderItem;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderSummaryResponse {

    private final Long orderId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private final LocalDateTime createdAt;

    private final String status;       // PAID, PREPARING, SHIPPED, COMPLETED 등
    private final int totalAmount;     // 주문 총액
    private final int itemCount;       // 품목 수
    private final String mainItemName; // 첫 상품명
    private final String mainItemThumb;// 첫 썸네일

    public OrderSummaryResponse(Order o) {
        this.orderId = o.getId();
        this.createdAt = o.getCreatedAt();
        this.status = o.getStatus() != null ? o.getStatus().name() : null;

        // ✅ 총액: Order.amount 사용(할인 반영된 최종 금액)
        Integer amount = o.getAmount();
        this.totalAmount = amount != null ? amount : 0;

        // ✅ 품목 목록: getOrderItems() 기준
        List<OrderItem> items = o.getOrderItems();
        this.itemCount = (items == null) ? 0 : items.size();

        if (this.itemCount > 0) {
            OrderItem first = items.get(0);
            this.mainItemName  = (first.getProduct() != null) ? first.getProduct().getName() : null;
            this.mainItemThumb = (first.getProduct() != null) ? first.getProduct().getThumbnailUrl() : null;
        } else {
            this.mainItemName = null;
            this.mainItemThumb = null;
        }
    }
}
