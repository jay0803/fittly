package kr.co.fittly.dto.faq;

import kr.co.fittly.vo.faq.FaqCategory;

public record FaqUpdateRequest(
        FaqCategory category,
        String title,
        String content
) {}
