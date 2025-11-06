package kr.co.fittly.dto.ai;

import kr.co.fittly.dto.product.OutfitDto;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiRecommendResponse {
    private List<OutfitDto> outfits;
}
