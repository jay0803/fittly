package kr.co.fittly.service.product;

import kr.co.fittly.dto.ai.RecommendResponse;
import kr.co.fittly.dto.product.ProductLatestResponse;
import kr.co.fittly.repository.product.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final ProductCategoryRepository catRepo;
    private final ProductQueryService productQuery;

    public RecommendResponse recommend(List<String> categories, List<String> preferredStyles, Integer outfitCount) {
        int count = (outfitCount == null || outfitCount <= 0) ? 2 : outfitCount;

        // 카테고리 기본값
        List<String> cats = (categories == null || categories.isEmpty())
                ? List.of("TOP", "BOTTOM", "OUTER", "SHOES")
                : categories;

        // 스타일 기본값
        List<String> styles = (preferredStyles == null || preferredStyles.isEmpty())
                ? List.of("MINIMAL", "CASUAL", "MODERN")
                : preferredStyles;

        List<RecommendResponse.Outfit> outfits = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            Map<String, ProductLatestResponse> items = new LinkedHashMap<>();
            BigDecimal total = BigDecimal.ZERO;

            for (String cat : cats) {
                List<ProductLatestResponse> candidates = productQuery.findCandidates(cat, styles, 5);
                ProductLatestResponse pick = candidates.isEmpty() ? null : candidates.get(i % candidates.size());

                if (pick != null) {
                    // categoryLabel 설정
                    String label = catRepo.findById(cat).map(c -> c.getLabel()).orElse(cat);
                    pick.setCategoryLabel(label);

                    items.put(cat, pick);
                    total = total.add(BigDecimal.valueOf(pick.getPrice()));
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
