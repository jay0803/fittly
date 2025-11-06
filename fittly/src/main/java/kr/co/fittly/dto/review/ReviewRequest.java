package kr.co.fittly.dto.review;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequest {
    private Long productId;
    private Long orderId;
    private Long orderItemId;  // ✅ 핵심
    private int rating;
    private String content;
    private String sex;
    private Integer height;
    private Integer weight;
}
