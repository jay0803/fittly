// src/main/java/kr/co/fittly/service/AiRecommendationService.java
package kr.co.fittly.service.product;

import kr.co.fittly.dto.ai.RecommendRequest;
import kr.co.fittly.dto.ai.RecommendResponse;

public interface AiRecommendationService {
    RecommendResponse recommend(RecommendRequest req, Long userIdOrNull);
}
