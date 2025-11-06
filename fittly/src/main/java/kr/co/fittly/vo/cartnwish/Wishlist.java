// File: src/main/java/kr/co/fittly/vo/cartnwish/Wishlist.java
package kr.co.fittly.vo.cartnwish;

import jakarta.persistence.*;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.user.User;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Locale;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "wishlist",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_wishlist_user_product_option",
                        columnNames = {"user_id", "product_id", "opt_color", "opt_size"}
                )
        }
)
public class Wishlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "opt_color", length = 64)
    private String color;

    @Column(name = "opt_color_name", length = 128)
    private String colorName;

    @Column(name = "opt_size", length = 64)
    private String size;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private Wishlist(User user, Product product, String color, String colorName, String size) {
        this.user = user;
        this.product = product;
        this.color = normalize(color);
        this.colorName = normalize(colorName);
        this.size  = normalize(size);
    }

    public static Wishlist of(User user, Product product) {
        return Wishlist.builder().user(user).product(product).build();
    }

    public static Wishlist of(User user, Product product, String color, String colorName, String size) {
        return Wishlist.builder()
                .user(user)
                .product(product)
                .color(color)
                .colorName(colorName)
                .size(size)
                .build();
    }

    public static Wishlist of(User user, Product product, String color, String size) {
        return of(user, product, color, null, size);
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        // 기존 normalize는 유지하고, 유니크 키에 포함되는 color/size만 소문자 정규화 추가
        this.color = toKey(normalize(this.color));      // trim → empty:null → lower
        this.colorName = normalize(this.colorName);     // 표시용은 대/소문자 보존
        this.size  = toKey(normalize(this.size));       // trim → empty:null → lower
    }

    private static String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    // 옵션 키 전용: DB 유니크(user, product, color, size) 판단 일관성 확보
    private static String toKey(String s) {
        return s == null ? null : s.toLowerCase(Locale.ROOT);
    }

    public void updateColorName(String colorName) {
        this.colorName = normalize(colorName);
    }

    public void setColorName(String colorName) {
        this.colorName = normalize(colorName);
    }
}
