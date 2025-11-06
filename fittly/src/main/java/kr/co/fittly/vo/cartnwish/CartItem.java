// src/main/java/kr/co/fittly/vo/cartnwish/CartItem.java
package kr.co.fittly.vo.cartnwish;

import jakarta.persistence.*;
import kr.co.fittly.vo.product.Product;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "cart_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cart_product_option",
                columnNames = {"cart_id", "product_id", "opt_color", "opt_size"}
        )
)
@BatchSize(size = 50)
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "opt_color", length = 64)
    private String color;

    @Column(name = "opt_color_name", length = 128)
    private String colorName;

    @Column(name = "opt_size", length = 64)
    private String size;

    @Column(nullable = false)
    private int quantity;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public CartItem(Cart cart, Product product, int quantity) {
        this(cart, product, null, null, null, quantity);
    }

    public CartItem(Cart cart, Product product, String color, String size, int quantity) {
        this(cart, product, color, null, size, quantity);
    }

    public CartItem(Cart cart, Product product, String color, String colorName, String size, int quantity) {
        this.cart = Objects.requireNonNull(cart, "cart must not be null");
        this.product = Objects.requireNonNull(product, "product must not be null");
        this.color = normalize(color);
        this.colorName = normalize(colorName);
        this.size  = normalize(size);
        setQuantity(quantity);
    }

    public static CartItem of(Cart cart, Product product, String color, String colorName, String size, int quantity) {
        return new CartItem(cart, product, color, colorName, size, quantity);
    }

    public void setQuantity(int quantity) {
        this.quantity = Math.max(1, quantity);
    }

    public void addQuantity(int delta) {
        setQuantity(this.quantity + delta);
    }

    @Transient
    public String getDisplayColor() {
        return firstNotBlank(this.colorName, this.color);
    }

    public void updateColorName(String colorName) {
        this.colorName = normalize(colorName);
    }

    public void updateOption(String color, String colorName, String size) {
        this.color = normalize(color);
        this.colorName = normalize(colorName);
        this.size = normalize(size);
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        // 안전 재정규화
        this.color = normalize(this.color);
        this.colorName = normalize(this.colorName);
        this.size  = normalize(this.size);
    }

    private static String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String firstNotBlank(String a, String b) {
        String aa = normalize(a);
        if (aa != null) return aa;
        return normalize(b);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CartItem that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
