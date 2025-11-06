// src/main/java/kr/co/fittly/dto/RecommendRequest.java
package kr.co.fittly.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class RecommendRequest {
    /** SLIM/NORMAL/MUSCULAR/CHUBBY/OTHER (nullable) */
    private String bodyType;
    /** 스타일 코드들 예: ["MINIMAL","CLASSIC"] */
    private List<String> preferredStyles;
    /** 카테고리 코드들 예: ["TOP","BOTTOM","OUTER","SHOES"] */
    private List<String> categories;
    /** 몇 벌 추천할지 (기본 2) */
    private Integer outfitCount;
}
