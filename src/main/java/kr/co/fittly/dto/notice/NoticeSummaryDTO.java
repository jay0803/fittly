package kr.co.fittly.dto.notice;

import java.time.Instant;

// 공지사항 목록에 보여줄 최소 정보만 담은 DTO
public record NoticeSummaryDTO(
        Long id,
        String title,
        boolean pinned,
        int pinOrder,
        long views,
        String authorName,
        Instant createdAt
) {}
