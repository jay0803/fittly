package kr.co.fittly.dto.product;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;

// items: {"TOP": ProductSimpleDto, "BOTTOM": ...}
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OutfitDto {
    private Map<String, ProductLatestResponse> items;
    private BigDecimal totalPrice;
}
