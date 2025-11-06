package kr.co.fittly.vo.order;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import kr.co.fittly.vo.payaddress.PayAddress;
import kr.co.fittly.vo.user.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, unique = true)
    private String orderUid;

    @Setter
    @Column(nullable = false)
    private String impUid;

    @Setter
    @Column(nullable = false)
    private Integer amount;

    @Embedded
    private PayAddress address;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<OrderItem> orderItems = new ArrayList<>();

    @Builder
    public Order(User user, String orderUid, String impUid, Integer amount,
                 PayAddress address, OrderStatus status) {
        this.user = user;
        this.orderUid = orderUid;
        this.impUid = impUid;
        this.amount = amount;
        this.address = address;
        this.status = status;
    }

    public List<OrderItem> getItems() {
        return orderItems;
    }

    public void recalcAmountFromItems() {
        int sum = 0;
        if (orderItems != null) {
            for (OrderItem oi : orderItems) {
                int unit = Math.max(0, oi.getOrderPrice() == null ? 0 : oi.getOrderPrice());
                int qty  = Math.max(1, oi.getQuantity());
                sum += unit * qty;
            }
        }
        this.amount = sum;
    }

    public void addItem(OrderItem item) {
        if (item == null) return;
        orderItems.add(item);
        item.setOrder(this);
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}
