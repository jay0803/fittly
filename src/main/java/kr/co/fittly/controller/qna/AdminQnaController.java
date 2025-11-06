package kr.co.fittly.controller.qna;

import kr.co.fittly.dto.qna.QnaResponseDTO;
import kr.co.fittly.service.qna.QnaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/qna")
public class AdminQnaController {

    private final QnaService qnaService;

    @GetMapping
    public ResponseEntity<List<QnaResponseDTO>> listAll() {
        return ResponseEntity.ok(qnaService.findAll());
    }

    @PutMapping("/{id}/answer")
    public ResponseEntity<QnaResponseDTO> answer(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String answer = body.get("answer");
        return ResponseEntity.ok(qnaService.answerQna(id, answer));
    }
}
