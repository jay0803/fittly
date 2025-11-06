package kr.co.fittly.dto.ai;

import kr.co.fittly.dto.product.ProductLatestResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class RecommendResponse {
    private LocalDateTime generatedAt;
    private List<Outfit> outfits;

    @Data
    @Builder
    public static class Outfit {
        private Map<String, ProductLatestResponse> items;
        private BigDecimal totalPrice;
    }
}
