package kr.co.fittly.vo.product;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "product_variant",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_product_color_size",
                        columnNames = {"product_id", "color", "size"}
                )
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(length = 16, nullable = false)
    private String color;

    @Column(name = "color_name", length = 50)
    private String colorName;

    @Column(length = 32, nullable = false)
    private String size;

    @Column(nullable = false)
    private Integer stock;
}
