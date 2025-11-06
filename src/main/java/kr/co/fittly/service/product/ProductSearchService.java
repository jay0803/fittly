// src/main/java/kr/co/fittly/service/product/ProductSearchService.java
package kr.co.fittly.service.product;

import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductSearchService {

    private final ProductRepository repo;

    public ProductSearchService(ProductRepository repo) {
        this.repo = repo;
    }

    public Page<Product> search(String categoryCode, List<String> tags, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            // 판매중만
            ps.add(cb.equal(root.get("status"), ProductStatus.SALE));

            // 카테고리 코드 매칭 (연관 경로)
            if (StringUtils.hasText(categoryCode)) {
                ps.add(cb.equal(root.get("category").get("code"), categoryCode));
            }

            // 복수 태그 AND (product.tags: 쉼표/스페이스 포함 문자열)
            if (tags != null) {
                for (String raw : tags) {
                    if (!StringUtils.hasText(raw)) continue;
                    String t = raw.trim().toLowerCase();
                    ps.add(cb.like(cb.lower(root.get("tags")), "%" + t + "%"));
                }
            }

            return cb.and(ps.toArray(new Predicate[0]));
        };

        return repo.findAll(spec, pageable);
    }
}
