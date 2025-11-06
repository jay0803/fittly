package kr.co.fittly.dto.product;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductSpecs {
    private String material;
    private String fit;
    private String season;
    private String origin;
}
