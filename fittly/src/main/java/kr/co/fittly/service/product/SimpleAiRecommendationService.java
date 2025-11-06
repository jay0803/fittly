// src/main/java/kr/co/fittly/service/SimpleAiRecommendationService.java
package kr.co.fittly.service.product;

import kr.co.fittly.dto.ai.RecommendRequest;
import kr.co.fittly.dto.ai.RecommendResponse;
import kr.co.fittly.dto.product.ProductLatestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SimpleAiRecommendationService implements AiRecommendationService {

    private final ProductQueryService productQueryService;

    @Override
    public RecommendResponse recommend(RecommendRequest req, Long userIdOrNull) {
        int outfitCount = (req.getOutfitCount() == null || req.getOutfitCount() <= 0) ? 2 : req.getOutfitCount();

        List<String> cats = (req.getCategories() == null || req.getCategories().isEmpty())
                ? List.of("TOP", "BOTTOM", "OUTER", "SHOES")
                : req.getCategories();

        List<String> styles = (req.getPreferredStyles() == null) ? List.of() : req.getPreferredStyles();

        Map<String, List<ProductLatestResponse>> pool = new LinkedHashMap<>();
        for (String c : cats) {
            pool.put(c, productQueryService.findCandidates(c, styles, 8)); // 최대 8개
        }

        // outfitCount 만큼 코디 구성 (간단히 상위 N개에서 순차 선택)
        List<RecommendResponse.Outfit> outfits = new ArrayList<>();
        for (int i = 0; i < outfitCount; i++) {
            Map<String, ProductLatestResponse> items = new LinkedHashMap<>();
            BigDecimal total = BigDecimal.ZERO;

            for (String c : cats) {
                List<ProductLatestResponse> list = pool.getOrDefault(c, List.of());
                if (!list.isEmpty()) {
                    ProductLatestResponse picked = list.get(Math.min(i, list.size() - 1));
                    items.put(c, picked);
                    if (picked.getPrice() != 0) { // int니까 null 아님, 0 이상만 더하고 싶으면 조건 이렇게
                        total = total.add(BigDecimal.valueOf(picked.getPrice()));
                    }
                }
            }
            outfits.add(RecommendResponse.Outfit.builder()
                    .items(items)
                    .totalPrice(total)
                    .build());
        }

        return RecommendResponse.builder()
                .generatedAt(LocalDateTime.now())
                .outfits(outfits)
                .build();
    }
}
