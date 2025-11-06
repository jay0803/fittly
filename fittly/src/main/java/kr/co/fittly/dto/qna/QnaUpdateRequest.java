package kr.co.fittly.dto.qna;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class QnaUpdateRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private String orderUid;

    private boolean secret;
}
