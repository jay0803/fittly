package kr.co.fittly.vo.product;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fashion_style")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FashionStyle {
    @Id
    @Column(length = 32)
    private String code;

    @Column(nullable = false, length = 50)
    private String label;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
