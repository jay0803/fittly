package kr.co.fittly.vo.order;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.review.Review;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "order_price", nullable = false)
    private Integer orderPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "opt_color", length = 64)
    private String color;

    @Column(name = "opt_color_name", length = 128)
    private String colorName;

    @Column(name = "opt_size", length = 64)
    private String size;

    @OneToOne(mappedBy = "orderItem", fetch = FetchType.LAZY)
    private Review review;

    @Builder
    public OrderItem(
            Order order,
            Product product,
            Integer orderPrice,
            Integer quantity,
            String color,
            String colorName,
            String size
    ) {
        this.order = order;
        this.product = product;
        this.orderPrice = sanitizePrice(orderPrice);
        this.quantity = sanitizeQty(quantity);
        this.color = norm(color);
        this.colorName = norm(colorName);
        this.size = norm(size);
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = sanitizeQty(quantity);
    }

    public void setOrderPrice(Integer orderPrice) {
        this.orderPrice = sanitizePrice(orderPrice);
    }

    @PrePersist @PreUpdate
    protected void onPersistOrUpdate() {
        this.color = norm(this.color);
        this.colorName = norm(this.colorName);
        this.size = norm(this.size);
        this.quantity = sanitizeQty(this.quantity);
        this.orderPrice = sanitizePrice(this.orderPrice);
    }

    private static String norm(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static Integer sanitizeQty(Integer q) {
        int v = (q == null) ? 1 : q;
        return (v < 1) ? 1 : v;
    }

    private static Integer sanitizePrice(Integer p) {
        int v = (p == null) ? 0 : p;
        return (v < 0) ? 0 : v;
    }
}
