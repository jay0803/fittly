package kr.co.fittly.dto.notice;

// 공지사항 수정 요청 (관리자만 사용)
public record NoticeUpdateRequest(
        String title,
        String content,
        Boolean pinned,
        Integer pinOrder
) {}