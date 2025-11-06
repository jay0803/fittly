package kr.co.fittly.vo.faq;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

public class FaqSpecs {
    public static Specification<Faq> search(FaqCategory category, String q) {
        return (Root<Faq> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Predicate predicate = cb.conjunction();

            // 카테고리 조건
            if (category != null) {
                predicate = cb.and(predicate,
                        cb.equal(root.get("category"), category));
            }

            // 제목+내용 검색
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim() + "%";

                Predicate titleLike = cb.like(root.get("title"), like);
                Predicate contentLike = cb.like(root.get("content"), like);

                predicate = cb.and(predicate, cb.or(titleLike, contentLike));
            }

            return predicate;
        };
    }
}

