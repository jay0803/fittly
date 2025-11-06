package kr.co.fittly.controller.product;

import jakarta.persistence.EntityNotFoundException;
import kr.co.fittly.dto.product.*;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;
    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<Page<ProductLatestResponse>> list(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(productService.list(query, status, page, size, "createdAt,DESC"));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<ProductLatestResponse>> getLatestAdmin(@RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(productService.findLatest(Math.max(1, limit)));
    }

    @GetMapping("/category/{cat}")
    public ResponseEntity<List<ProductLatestResponse>> getByCategoryAdmin(
            @PathVariable String cat,
            @RequestParam(defaultValue = "12") int limit
    ) {
        return ResponseEntity.ok(productService.findByCategory(cat, Math.max(1, limit)));
    }

    @GetMapping("/raw/latest")
    public ResponseEntity<?> getLatestRaw(@RequestParam(defaultValue = "12") int limit) {
        Pageable pageable = PageRequest.of(0, Math.max(1, Math.min(60, limit)));
        return ResponseEntity.ok(productRepository.findLatest(pageable));
    }

    @GetMapping("/raw/category/{cat}")
    public ResponseEntity<?> getByCategoryRaw(
            @PathVariable String cat,
            @RequestParam(defaultValue = "12") int limit
    ) {
        Pageable pageable = PageRequest.of(0, Math.max(1, Math.min(60, limit)));
        return ResponseEntity.ok(productRepository.findByCategory(cat, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getDetail(id));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProductDetailResponse> createByJson(@RequestBody ProductCreateRequest req) {
        return ResponseEntity.ok(productService.createJson(req));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductDetailResponse> createByMultipart(
            @RequestPart("data") ProductCreateRequest req,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {
        return ResponseEntity.ok(productService.createMultipart(req, thumbnail, images));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDetailResponse> updateByMultipart(
            @PathVariable Long id,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "price", required = false) String price,
            @RequestParam(value = "discountRate", required = false) String discountRate,
            @RequestParam(value = "discountPrice", required = false) String discountPrice,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "categoryId", required = false) String categoryId,
            @RequestParam(value = "tags", required = false) String tagsCsv,
            @RequestParam(value = "styleIds", required = false) List<String> styleIds,
            @RequestParam(value = "keepImageIds", required = false) List<Long> keepImageIds,
            @RequestParam(value = "removeImageIds", required = false) List<Long> removeImageIds,
            @RequestParam(value = "removeImageUrls", required = false) String removeImageUrlsJson,
            @RequestParam(value = "updateVariants", required = false) String updateVariantsJson,
            @RequestParam(value = "createVariants", required = false) String createVariantsJson,
            @RequestParam(value = "removeVariantIds", required = false) String removeVariantIdsJson,
            @RequestParam(value = "replaceVariants", required = false) String replaceVariantsJson
    ) throws IOException {
        ProductDetailResponse dto = productService.updateMultipart(
                id,
                brand, name, price, discountRate, discountPrice, status, categoryId, tagsCsv, styleIds,
                thumbnail, newImages,
                keepImageIds, removeImageIds, removeImageUrlsJson,
                updateVariantsJson, createVariantsJson, removeVariantIdsJson,
                replaceVariantsJson
        );
        return ResponseEntity.ok(dto);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> onNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(404).body(e.getMessage());
    }
}
