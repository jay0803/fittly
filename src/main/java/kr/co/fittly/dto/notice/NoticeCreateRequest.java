package kr.co.fittly.dto.notice;

// 공지사항 생성 요청 (관리자만 사용)
public record NoticeCreateRequest(
        String title,
        String content,
        boolean pinned,
        Integer pinOrder
) {}
