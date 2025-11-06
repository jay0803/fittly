package kr.co.fittly.vo.product;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_category")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductCategory {

    @Id
    @Column(length = 16)
    private String code;

    @Column(nullable = false, length = 30)
    private String label;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
