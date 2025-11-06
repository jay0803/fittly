package kr.co.fittly.vo.notice;

import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class NoticeSpecs {

    // 검색 조건 빌드
    public static Specification<Notice> search(NoticeSearchType type, String q) {
        if (q == null || q.isBlank()) {
            return (root, query, cb) -> cb.conjunction(); // 조건 없음
        }

        return switch (type) {
            case TITLE -> (root, query, cb) ->
                    cb.like(cb.lower(root.get("title")), like(q));

            case TITLE_CONTENT -> (root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("title")), like(q)),
                            cb.like(root.get("content"), like(q)) // lower() 빼고 그대로 사용
                    );
        };
    }

    // pinned 제외 조건 (일반 목록 전용)
    public static Specification<Notice> excludePinned() {
        return (root, query, cb) -> cb.equal(root.get("pinned"), false);
    }

    private static String like(String q) {
        if (q == null) return "%";
        String val = q.trim();
        if (val.isEmpty()) return "%";
        return "%" + val.toLowerCase() + "%";
    }
}
