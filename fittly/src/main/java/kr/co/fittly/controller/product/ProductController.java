package kr.co.fittly.controller.product;

import jakarta.annotation.security.PermitAll;
import jakarta.persistence.EntityNotFoundException;
import kr.co.fittly.dto.product.*;
import kr.co.fittly.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    @PermitAll
    @GetMapping("/search")
    public ResponseEntity<Page<ProductLatestResponse>> unifiedSearch(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,DESC") String sort
    ) {
        List<String> normalizedTags = normalizeTags(tags);
        if (StringUtils.hasText(q)) {
            return ResponseEntity.ok(productService.unifiedSearch(q, page, size, sort));
        } else {
            return ResponseEntity.ok(productService.searchByTagsAny(normalizedTags, page, size, sort));
        }
    }

    @PermitAll
    @GetMapping("/latest")
    public ResponseEntity<List<ProductLatestResponse>> getLatest(@RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(productService.findLatest(Math.max(1, limit)));
    }

    @PermitAll
    @GetMapping("/category/{cat}")
    public ResponseEntity<List<ProductLatestResponse>> getByCategory(
            @PathVariable String cat,
            @RequestParam(defaultValue = "12") int limit
    ) {
        return ResponseEntity.ok(productService.findByCategory(cat, Math.max(1, limit)));
    }

    @PermitAll
    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getDetail(id));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> onIllegalState(IllegalStateException e) {
        return ResponseEntity.status(409).body(e.getMessage());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> onNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(404).body(e.getMessage());
    }

    private List<String> normalizeTags(List<String> tagsParam) {
        List<String> out = new ArrayList<>();
        if (tagsParam == null) return out;
        for (String t : tagsParam) {
            if (!StringUtils.hasText(t)) continue;
            Arrays.stream(t.split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .forEach(out::add);
        }
        return out;
    }
}
