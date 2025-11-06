package kr.co.fittly.dto.ai;

import kr.co.fittly.vo.user.UserProfile.BodyType;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AiRecommendRequest {
    private BodyType bodyType;
    private List<String> preferredStyles; // 코드값 권장: ["MINIMAL","STREET",...]
    private List<String> categories;      // ["TOP","BOTTOM","OUTER","SHOES"]
    private Integer outfitCount;          // 기본 2
}
