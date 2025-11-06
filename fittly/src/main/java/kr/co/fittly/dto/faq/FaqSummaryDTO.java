// FaqSummaryDTO.java
package kr.co.fittly.dto.faq;

import kr.co.fittly.vo.faq.Faq;
import java.time.Instant;

public record FaqSummaryDTO(
        Long id,
        String category,   // ← enum 대신 String
        String title,
        Instant createdAt
) {
    public FaqSummaryDTO(Faq faq) {
        this(
                faq.getId(),
                faq.getCategory().getDisplayName(), // 한글 변환
                faq.getTitle(),
                faq.getCreatedAt()
        );
    }
}
