package kr.co.fittly.dto.faq;

import kr.co.fittly.vo.faq.FaqCategory;

public record FaqCreateRequest(
        FaqCategory category,
        String title,
        String content
) {}
