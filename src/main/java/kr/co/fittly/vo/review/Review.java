package kr.co.fittly.vo.review;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import kr.co.fittly.vo.order.Order;
import kr.co.fittly.vo.order.OrderItem;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.user.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})  // ✅ Hibernate 프록시 무시
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rid;

    /** ✅ 작성자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore   // 사용자 정보 직렬화 차단
    private User user;

    /** ✅ 상품 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /** ✅ 주문 (새로 추가됨) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    /** ✅ 주문상품 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    @JsonIgnore
    private OrderItem orderItem;

    /** ✅ 리뷰 정보 */
    private int rating;
    private String content;
    private String sex;
    private Integer height;
    private Integer weight;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** ✅ 리뷰 이미지 리스트 */
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReviewImage> images = new ArrayList<>();

    /** ✅ 라이프사이클 콜백 */
    @PrePersist
    protected void onCreate() {
        this.createdAt = (this.createdAt == null) ? LocalDateTime.now() : this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
