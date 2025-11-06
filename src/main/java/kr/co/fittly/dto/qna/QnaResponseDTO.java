package kr.co.fittly.dto.qna;

import kr.co.fittly.dto.product.ProductLatestResponse;
import kr.co.fittly.vo.qna.QnaCategory;
import kr.co.fittly.vo.qna.QnaStatus;
import kr.co.fittly.vo.qna.QnaSubCategory;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QnaResponseDTO {
    private Long id;
    private QnaCategory category;
    private QnaSubCategory subcategory;
    private String orderUid;
    private String title;
    private String content;
    private String imageUrl;
    private String answer;
    private QnaStatus status;
    private boolean secret;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String userLoginId;
    private boolean owner;
    private boolean admin;
    private ProductLatestResponse product;
    private Long productId; // 251022_영미
}

