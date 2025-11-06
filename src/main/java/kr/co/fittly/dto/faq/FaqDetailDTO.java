// FaqDetailDTO.java
package kr.co.fittly.dto.faq;

import kr.co.fittly.vo.faq.Faq;
import java.time.Instant;

public record FaqDetailDTO(
        Long id,
        String category,   // ← enum 대신 String
        String title,
        String content,
        String authorName,
        Instant createdAt,
        Instant updatedAt
) {
    public FaqDetailDTO(Faq faq) {
        this(
                faq.getId(),
                faq.getCategory().getDisplayName(), // 한글 변환
                faq.getTitle(),
                faq.getContent(),
                faq.getAuthor().getName(),
                faq.getCreatedAt(),
                faq.getUpdatedAt()
        );
    }
}
