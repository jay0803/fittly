// src/main/java/kr/co/fittly/vo/qna/QnA.java
package kr.co.fittly.vo.qna;

import jakarta.persistence.*;
import kr.co.fittly.vo.order.Order;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.user.User;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "qna",
        indexes = {
                @Index(name = "idx_qna_product_id_created_at", columnList = "product_id, created_at"),
                @Index(name = "idx_qna_user_id_created_at", columnList = "user_id, created_at"),
                @Index(name = "idx_qna_order_id", columnList = "order_id")
        }
)
@Getter @Setter @ToString
@NoArgsConstructor @AllArgsConstructor @Builder
public class QnA {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30, nullable = false)
    private QnaCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "subcategory", length = 30, nullable = false)
    private QnaSubCategory subcategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // 남겨두고 싶으면 유지
    @Column(name = "order_uid", length = 64)
    private String orderUid;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    private String content;

    private String imageUrl;

    @Lob
    private String answer;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private QnaStatus status = QnaStatus.PENDING;

    @Column(name = "is_secret", nullable = false)
    @Builder.Default
    private boolean secret = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}