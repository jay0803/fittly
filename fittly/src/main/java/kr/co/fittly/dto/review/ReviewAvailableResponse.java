package kr.co.fittly.dto.review;

import kr.co.fittly.vo.order.OrderItem;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReviewAvailableResponse {

    private Long orderItemId;
    private Long orderId;
    private Long productId;
    private String productName;
    private String brand;
    private String thumbnailUrl;
    private String orderDate;
    private String size;
    private String color;

    public static ReviewAvailableResponse from(OrderItem item) {
        if (item == null) return null;

        var product = item.getProduct();
        var order = item.getOrder();

        return ReviewAvailableResponse.builder()
                .orderItemId(item.getId())
                .orderId(order != null ? order.getId() : null)
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : "(상품 정보 없음)")
                .brand(product != null ? product.getBrand() : "-")
                .thumbnailUrl(product != null ? product.getThumbnailUrl() : null)
                .orderDate(order != null && order.getCreatedAt() != null
                        ? order.getCreatedAt().toLocalDate().toString()
                        : null)
                .size(item.getSize())
                .color(item.getColorName() != null ? item.getColorName() : item.getColor())
                .build();
    }
}
