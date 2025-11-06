package kr.co.fittly.dto.qna;

import jakarta.validation.constraints.NotBlank;
import kr.co.fittly.vo.qna.QnaCategory;
import kr.co.fittly.vo.qna.QnaSubCategory;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QnaRequestDTO {
    private Long productId;

    private QnaCategory category;
    private QnaSubCategory subcategory;

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private String orderUid;
    private String imageUrl;
    private boolean secret;
}
