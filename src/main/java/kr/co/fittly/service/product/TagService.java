package kr.co.fittly.service.product;

import kr.co.fittly.repository.product.ProductCategoryRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.vo.product.ProductCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 운영 DB에 'product_tag' 같은 테이블이 없어도 동작하도록
 * 카테고리/스타일/계절 등의 키워드를 혼합 제공하는 가벼운 서비스.
 * 추후 Tag 테이블이 생기면 여기만 교체.
 */
@Service
@RequiredArgsConstructor
public class TagService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;

    private static final List<String> FALLBACK_SEASONS = List.of("봄","여름","가을","겨울");
    private static final List<String> FALLBACK_KIND = List.of("상의","하의","아우터","신발");
    private static final List<String> FALLBACK_STYLE = List.of("스트릿","캐주얼","힙합","빈티지","어반","베이직","모던","미니멀");

    public List<String> findAllTags() {
        // 카테고리 라벨 + 기본 스타일/계절
        Set<String> s = new LinkedHashSet<>();
        s.addAll(productCategoryRepository.findAll().stream()
                .map(ProductCategory::getLabel).filter(Objects::nonNull).toList());
        s.addAll(FALLBACK_KIND);
        s.addAll(FALLBACK_STYLE);
        s.addAll(FALLBACK_SEASONS);
        return s.stream().distinct().toList();
    }

    public List<String> topTags(int limit) {
        // 간단 폴백: 자주 쓰이는 후보를 우선 반환
        List<String> base = new ArrayList<>(FALLBACK_STYLE);
        base.addAll(FALLBACK_KIND);
        base.addAll(FALLBACK_SEASONS);
        return base.stream().limit(Math.max(1, limit)).toList();
    }

    public List<String> suggest(String prefix, int limit) {
        String p = Optional.ofNullable(prefix).orElse("").toLowerCase(Locale.ROOT).replaceAll("\\s+","");
        if (p.isEmpty()) return topTags(limit);
        return findAllTags().stream()
                .filter(t -> t != null && t.toLowerCase(Locale.ROOT).replaceAll("\\s+","").startsWith(p))
                .limit(Math.max(1, limit))
                .collect(Collectors.toList());
    }
}
