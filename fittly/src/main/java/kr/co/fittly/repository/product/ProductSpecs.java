// src/main/java/kr/co/fittly/repository/product/ProductSpecs.java
package kr.co.fittly.repository.product;

import kr.co.fittly.vo.product.Product;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.util.*;

public final class ProductSpecs {

    private ProductSpecs() {}

    /** ANY tags (하나라도 매칭) — 대소문자 무시 */
    public static Specification<Product> hasAnyTag(Collection<String> rawTags) {
        final List<String> tokens = normalizeTags(rawTags);
        if (tokens.isEmpty()) return null; // no-op

        return (root, query, cb) -> {
            Expression<String> tagsLower = cb.lower(root.get("tags"));              // lower(tags)
            // "," || lower(tags) || ","  -> 경계 비교용
            Expression<String> csv = cb.concat(cb.concat(cb.literal(","), tagsLower), cb.literal(","));
            List<Predicate> ors = new ArrayList<>();
            for (String t : tokens) {
                String esc = escapeLike(t);
                String pattern = "%," + esc + ",%";
                ors.add(cb.like(csv, pattern, '\\'));
            }
            return cb.and(cb.isNotNull(tagsLower), cb.or(ors.toArray(Predicate[]::new)));
        };
    }

    /** ALL tags (모두 포함) — 각 태그는 OR-군(공백/언더스코어/무공백 변형)으로 묶고, 전체는 AND */
    public static Specification<Product> hasAllTags(Collection<String> rawTags) {
        final List<String> base = normalizeTagsDistinctKeys(rawTags); // 사용자가 지정한 개별 '의미 단위' 보존
        if (base.isEmpty()) return null;

        return (root, query, cb) -> {
            Expression<String> tagsLower = cb.lower(root.get("tags"));
            Expression<String> csv = cb.concat(cb.concat(cb.literal(","), tagsLower), cb.literal(","));

            List<Predicate> ands = new ArrayList<>();
            for (String key : base) {
                // key에 대해 변형 후보 생성
                Set<String> variants = expandVariants(key);
                List<Predicate> ors = new ArrayList<>();
                for (String v : variants) {
                    String esc = escapeLike(v);
                    ors.add(cb.like(csv, "%," + esc + ",%", '\\'));
                }
                ands.add(cb.or(ors.toArray(Predicate[]::new)));
            }
            return cb.and(cb.isNotNull(tagsLower), cb.and(ands.toArray(Predicate[]::new)));
        };
    }

    /* ===================== 내부 유틸 ===================== */

    /** 입력에서 공백/빈값 제거, '#' 제거, lower-case로 정규화하여 단일 토큰들(콤마 분해 포함)을 반환 */
    private static List<String> normalizeTags(Collection<String> rawTags) {
        Set<String> out = new LinkedHashSet<>();
        if (rawTags == null) return List.of();

        for (String s : rawTags) {
            if (s == null) continue;
            for (String piece : s.split(",")) {
                String t = piece == null ? "" : piece.trim();
                if (t.isEmpty()) continue;
                t = t.replace("#", "");         // 해시 제거
                t = t.toLowerCase(Locale.ROOT); // 소문자
                // 기본 + 변형 추가
                out.add(t);
                out.add(t.replace("_", ""));        // 언더스코어 제거
                out.add(t.replace(" ", ""));        // 공백 제거
                out.add(t.replace(" ", "_"));       // 공백→언더스코어
                out.add(t.replace("_", " "));       // 언더스코어→공백
            }
        }
        // 빈 문자열 지우기
        out.removeIf(String::isBlank);
        return new ArrayList<>(out);
    }

    /** ALL 매칭용: 사용자가 준 '의미 단위'를 보존 (콤마 기준으로만 분해) */
    private static List<String> normalizeTagsDistinctKeys(Collection<String> rawTags) {
        List<String> keys = new ArrayList<>();
        if (rawTags == null) return keys;

        for (String s : rawTags) {
            if (s == null) continue;
            for (String piece : s.split(",")) {
                String t = piece.trim();
                if (t.isEmpty()) continue;
                t = t.replace("#", "").toLowerCase(Locale.ROOT);
                keys.add(t);
            }
        }
        return keys;
    }

    /** 한 키에 대해 “그럴법한” 변형 후보들을 생성 (공백/언더스코어/무공백) */
    private static Set<String> expandVariants(String key) {
        Set<String> v = new LinkedHashSet<>();
        String k = key == null ? "" : key.trim().toLowerCase(Locale.ROOT);
        if (k.isEmpty()) return v;

        v.add(k);
        v.add(k.replace(" ", ""));
        v.add(k.replace("_", ""));
        v.add(k.replace(" ", "_"));
        v.add(k.replace("_", " "));
        return v;
    }

    /** LIKE 패턴에서 와일드카드 문자 이스케이프 */
    private static String escapeLike(String s) {
        if (s == null || s.isEmpty()) return s;
        // '\' -> '\\', '%' -> '\%', '_' -> '\_'
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
