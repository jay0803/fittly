package kr.co.fittly.dto.notice;

import java.time.Instant;

// 공지사항 상세 조회에 필요한 정보
public record NoticeDetailDTO(
        Long id,
        String title,
        String content,
        boolean pinned,
        int pinOrder,
        long views,
        String authorName,
        Instant createdAt,
        Instant updatedAt
) {}
