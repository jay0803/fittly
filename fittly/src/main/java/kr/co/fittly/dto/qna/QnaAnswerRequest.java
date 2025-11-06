package kr.co.fittly.dto.qna;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class QnaAnswerRequest {
    @NotBlank
    private String answer;
}
