// src/main/java/kr/co/fittly/dto/order/OrderItemResponse.java
package kr.co.fittly.dto.order;

import com.fasterxml.jackson.annotation.JsonInclude;
import kr.co.fittly.vo.order.OrderItem;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드는 응답에서 제외
public class OrderItemResponse {

    private Long productId;
    private String productName;
    private String thumbnailUrl;

    private int quantity;
    private int orderPrice;

    // ✅ 주문 시점 옵션 스냅샷
    private String color;       // 코드/값 (예: #000000)
    private String colorName;   // 표기명 (예: 블랙)
    private String size;        // 예: M, 270

    public OrderItemResponse(OrderItem item) {
        this.productId   = item.getProduct().getId();
        this.productName = item.getProduct().getName();
        this.thumbnailUrl = item.getProduct().getThumbnailUrl();

        this.quantity    = item.getQuantity();
        this.orderPrice  = item.getOrderPrice();

        // 옵션 필드 매핑
        this.color       = item.getColor();
        this.colorName   = item.getColorName();
        this.size        = item.getSize();
    }
}
