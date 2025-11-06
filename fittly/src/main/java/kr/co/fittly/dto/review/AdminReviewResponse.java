package kr.co.fittly.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewResponse {
    private Long id;
    private String userName;    // 사용자 이름
    private String userId;      // 사용자 아이디
    private String brand;       // 브랜드명
    private String productName; // 상품명
    private int rating;         // 평점
    private String content;     // 후기 내용
    private List<String> imageUrls; // 후기 이미지 URL 리스트
    private LocalDateTime createdAt;
}
