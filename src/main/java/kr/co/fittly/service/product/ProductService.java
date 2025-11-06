// src/main/java/kr/co/fittly/service/product/ProductService.java
package kr.co.fittly.service.product;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import kr.co.fittly.dto.product.ProductCreateRequest;
import kr.co.fittly.dto.product.ProductDetailResponse;
import kr.co.fittly.dto.product.ProductLatestResponse;
import kr.co.fittly.repository.product.FashionStyleRepository;
import kr.co.fittly.repository.product.ProductCategoryRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.repository.product.ProductVariantRepository;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductCategory;
import kr.co.fittly.vo.product.ProductStatus;
import kr.co.fittly.vo.product.ProductVariant;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final FashionStyleRepository styleRepository;
    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;
    private final ProductVariantRepository variantRepository;
    private final ProductCategoryRepository categoryRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /* ===================== 🔵 태그 관련 ===================== */

    public List<String> getAllTags() {
        List<String> raws = productRepository.findAllTagStrings();
        if (raws == null || raws.isEmpty()) return List.of();
        Set<String> seen = new LinkedHashSet<>();
        for (String s : raws) {
            if (s == null || s.isBlank()) continue;
            for (String tok : s.split(",")) {
                String t = tok == null ? "" : tok.trim();
                if (t.isEmpty()) continue;
                String key = t.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
                if (seen.stream().map(x -> x.replaceAll("\\s+", "").toLowerCase(Locale.ROOT)).noneMatch(key::equals)) {
                    seen.add(t);
                }
            }
        }
        return new ArrayList<>(seen);
    }

    public List<String> getTopTags(int limit) {
        List<String> raws = productRepository.findAllTagStrings();
        if (raws == null || raws.isEmpty()) return List.of();
        Map<String, Integer> freq = new HashMap<>();
        for (String s : raws) {
            if (s == null || s.isBlank()) continue;
            for (String tok : s.split(",")) {
                String t = tok == null ? "" : tok.trim();
                if (t.isEmpty()) continue;
                String key = t.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
                freq.merge(key, 1, Integer::sum);
            }
        }
        Map<String, String> display = new LinkedHashMap<>();
        for (String t : getAllTags()) {
            display.putIfAbsent(t.replaceAll("\\s+", "").toLowerCase(Locale.ROOT), t);
        }
        return freq.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(Math.max(1, limit))
                .map(e -> display.getOrDefault(e.getKey(), e.getKey()))
                .toList();
    }

    public List<String> suggestTags(String prefix, int limit) {
        String p = prefix == null ? "" : prefix.trim();
        List<String> all = getAllTags();
        if (p.isEmpty()) return all.stream().limit(Math.max(1, limit)).toList();
        String key = p.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
        return all.stream()
                .filter(t -> t.replaceAll("\\s+", "").toLowerCase(Locale.ROOT).startsWith(key))
                .limit(Math.max(1, limit))
                .toList();
    }


    public ProductDetailResponse getDetail(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다. id=" + id));
        List<ProductVariant> variants = variantRepository.findByProduct_Id(id);
        return ProductDetailResponse.of(p, variants);
    }

    public List<ProductLatestResponse> findLatest(int limit) {
        int size = Math.max(1, limit);
        return productRepository.findLatest(PageRequest.of(0, size));
    }

    public List<ProductLatestResponse> findByCategory(String categoryCode, int limit) {
        int size = Math.max(1, limit);
        return productRepository.findByCategory(categoryCode, PageRequest.of(0, size));
    }

    public Page<ProductLatestResponse> list(String query, String statusStr, int page, int size, String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        String q = (query == null || query.isBlank()) ? null : query.trim();
        ProductStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            String v = statusStr.trim().toUpperCase(Locale.ROOT);
            if (!"ALL".equals(v) && !"ACTIVE_ALL".equals(v)) {
                try { status = ProductStatus.valueOf(v); } catch (IllegalArgumentException ignored) {}
            }
        }
        Page<Product> pg = productRepository.search(q, status, pageable);
        return pg.map(this::toLatestDto);
    }

    public Page<ProductLatestResponse> unifiedSearch(String q, int page, int size, String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        String qq = (q == null || q.isBlank()) ? null : q.trim();
        return productRepository.searchUnified(qq, pageable);
    }

    public Page<ProductLatestResponse> searchByTag(String tag, int page, int size, String sort) {
        if (!StringUtils.hasText(tag)) return Page.empty(buildPageable(page, size, sort));
        Pageable pageable = buildPageable(page, size, sort);
        Page<Product> pg = productRepository.searchByTag(tag.trim(), pageable);
        return pg.map(this::toLatestDto);
    }

    public Page<ProductLatestResponse> searchByTagsAny(List<String> tags, int page, int size, String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        if (tags == null || tags.isEmpty()) return Page.empty(pageable);
        List<String> cleaned = tags.stream()
                .filter(StringUtils::hasText)
                .map(s -> s.replaceAll("\\s+", "").toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
        if (cleaned.isEmpty()) return Page.empty(pageable);
        String regex = String.join("|", cleaned);
        Page<Product> pg = productRepository.searchByTagsRegex(regex, pageable);
        return pg.map(this::toLatestDto);
    }


    @Transactional
    public ProductDetailResponse createJson(ProductCreateRequest req) {
        Product entity = req.toEntity();
        if (req.getCategory() != null && !req.getCategory().isBlank()) {
            entity.setCategory(categoryRepository.findById(req.getCategory())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + req.getCategory())));
        }
        if (req.getStyleCode() != null && !req.getStyleCode().isBlank()) {
            entity.setStyle(styleRepository.findById(req.getStyleCode())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid style: " + req.getStyleCode())));
        }
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            try { entity.setImageUrls(objectMapper.writeValueAsString(req.getImageUrls())); }
            catch (JsonProcessingException e) { throw new RuntimeException("이미지 URL 직렬화 실패", e); }
        }
        Product saved = productRepository.save(entity);
        saveVariants(saved, req);
        List<ProductVariant> variants = variantRepository.findByProduct_Id(saved.getId());
        return ProductDetailResponse.of(saved, variants);
    }

    @Transactional
    public ProductDetailResponse createMultipart(ProductCreateRequest req,
                                                 MultipartFile thumbnail,
                                                 List<MultipartFile> images) throws IOException {
        Product entity = req.toEntity();
        if (req.getCategory() != null && !req.getCategory().isBlank()) {
            entity.setCategory(categoryRepository.findById(req.getCategory())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + req.getCategory())));
        }
        if (thumbnail != null && !thumbnail.isEmpty()) {
            entity.setThumbnailUrl(fileStorageService.store(thumbnail));
        }
        List<String> urls = new ArrayList<>();
        if (images != null) {
            for (MultipartFile f : images) if (f != null && !f.isEmpty()) urls.add(fileStorageService.store(f));
        }
        if (!urls.isEmpty()) entity.setImageUrls(objectMapper.writeValueAsString(urls));
        Product saved = productRepository.save(entity);
        saveVariants(saved, req);
        List<ProductVariant> variants = variantRepository.findByProduct_Id(saved.getId());
        return ProductDetailResponse.of(saved, variants);
    }

    /* ===== 수정 (멀티파트) ===== */
    @Transactional
    public ProductDetailResponse updateMultipart(
            Long id,
            String brand, String name, String price, String discountRate, String discountPrice,
            String status, String categoryId, String tagsCsv, List<String> styleIds,
            MultipartFile thumbnail, List<MultipartFile> newImages,
            List<Long> keepImageIds, List<Long> removeImageIds, String removeImageUrlsJson,
            String updateVariantsJson, String createVariantsJson, String removeVariantIdsJson
    ) throws IOException {
        return updateMultipart(
                id, brand, name, price, discountRate, discountPrice,
                status, categoryId, tagsCsv, styleIds,
                thumbnail, newImages,
                keepImageIds, removeImageIds, removeImageUrlsJson,
                updateVariantsJson, createVariantsJson, removeVariantIdsJson, null
        );
    }

    @Transactional
    public ProductDetailResponse updateMultipart(
            Long id,
            String brand, String name, String price, String discountRate, String discountPrice,
            String status, String categoryId, String tagsCsv, List<String> styleIds,
            MultipartFile thumbnail, List<MultipartFile> newImages,
            List<Long> keepImageIds, List<Long> removeImageIds, String removeImageUrlsJson,
            String updateVariantsJson, String createVariantsJson, String removeVariantIdsJson,
            String replaceVariantsJson
    ) throws IOException {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다. id=" + id));
        if (StringUtils.hasText(brand)) p.setBrand(brand.trim());
        if (StringUtils.hasText(name)) p.setName(name.trim());
        if (StringUtils.hasText(price)) try { p.setPrice(Integer.parseInt(price)); } catch (Exception ignored) {}
        if (StringUtils.hasText(status)) try { p.setStatus(ProductStatus.valueOf(status.toUpperCase())); } catch (Exception ignored) {}

        if (StringUtils.hasText(categoryId)) {
            ProductCategory cat = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + categoryId));
            p.setCategory(cat);
        }
        if (thumbnail != null && !thumbnail.isEmpty()) p.setThumbnailUrl(fileStorageService.store(thumbnail));

        List<String> currentUrls = readImageUrls(p.getImageUrls());
        List<String> removeUrls = readJsonArray(removeImageUrlsJson);
        if (!removeUrls.isEmpty()) currentUrls.removeIf(removeUrls::contains);
        if (newImages != null) for (MultipartFile f : newImages)
            if (f != null && !f.isEmpty()) currentUrls.add(fileStorageService.store(f));
        currentUrls = currentUrls.stream().filter(Objects::nonNull).distinct().toList();
        p.setImageUrls(writeImageUrls(currentUrls));

        // variants 교체 or diff 적용
        List<Map<String, Object>> replaceRows = readListOfMaps(replaceVariantsJson);
        if (!replaceRows.isEmpty()) {
            List<ProductVariant> all = variantRepository.findByProduct_Id(p.getId());
            if (!all.isEmpty()) { variantRepository.deleteAll(all); variantRepository.flush(); }
            List<ProductVariant> toSave = new ArrayList<>();
            for (Map<String, Object> v : replaceRows) {
                String c = asStr(v.get("color"));
                String s = asStr(v.get("size"));
                Integer st = toInt(v.get("stock"));
                if (!StringUtils.hasText(c) || !StringUtils.hasText(s)) continue;
                ProductVariant nv = new ProductVariant();
                nv.setProduct(p); nv.setColor(c); nv.setSize(s);
                nv.setStock(st == null ? 0 : Math.max(0, st));
                toSave.add(nv);
            }
            variantRepository.saveAll(toSave);
        }
        Product saved = productRepository.save(p);
        List<ProductVariant> variants = variantRepository.findByProduct_Id(saved.getId());
        return ProductDetailResponse.of(saved, variants);
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) throw new EntityNotFoundException("상품을 찾을 수 없습니다. id=" + id);
        List<ProductVariant> exists = variantRepository.findByProduct_Id(id);
        if (!exists.isEmpty()) variantRepository.deleteAll(exists);
        try { productRepository.deleteById(id); }
        catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("다른 데이터에서 참조 중이라 삭제할 수 없습니다.", e);
        }
    }

    @Transactional
    protected void saveVariants(Product product, ProductCreateRequest req) {
        if (req == null || req.getColorSizes() == null || req.getColorSizes().isEmpty()) return;

        // 요청 내 중복(color|size) 제거
        Set<String> seen = new HashSet<>();
        List<ProductVariant> toSave = new ArrayList<>();

        for (ProductCreateRequest.ColorSizes cs : req.getColorSizes()) {
            if (cs == null || cs.getColor() == null) continue;
            String color = cs.getColor().trim();
            if (color.isEmpty()) continue;
            if (cs.getSizes() == null) continue;

            String colorName = (cs.getColorName() == null || cs.getColorName().isBlank())
                    ? null : cs.getColorName().trim();

            for (ProductCreateRequest.VariantSize vs : cs.getSizes()) {
                if (vs == null || vs.getSize() == null) continue;
                String size = vs.getSize().trim();
                if (size.isEmpty()) continue;

                String key = color + "|" + size;
                if (!seen.add(key)) continue;

                Integer stock = Optional.ofNullable(vs.getStock()).orElse(0);
                if (stock < 0) stock = 0;

                ProductVariant v = new ProductVariant();
                v.setProduct(product);
                v.setColor(color);
                v.setColorName(colorName);
                v.setSize(size);
                v.setStock(stock);
                toSave.add(v);
            }
        }

        if (!toSave.isEmpty()) {
            variantRepository.saveAll(toSave);
        }
    }


    private Pageable buildPageable(int page, int size, String sort) {
        Sort sortObj = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        if (StringUtils.hasText(sort)) {
            String[] sp = sort.replace(" ", "").split(",");
            String key = sp[0];
            boolean desc = sp.length > 1 && "DESC".equalsIgnoreCase(sp[1]);
            sortObj = Sort.by(new Sort.Order(desc ? Sort.Direction.DESC : Sort.Direction.ASC, key))
                    .and(Sort.by(Sort.Order.desc("id")));
        }
        return PageRequest.of(Math.max(0, page), Math.max(1, size), sortObj);
    }

    private ProductLatestResponse toLatestDto(Product p) {
        return new ProductLatestResponse(
                p.getId(),p.getProductCode(), p.getBrand(), p.getName(),
                p.getPrice(), p.getDiscountPrice(),
                p.getThumbnailUrl(),
                p.getCategory() != null ? p.getCategory().getCode() : null,
                p.getCreatedAt()
        );
    }

    private List<String> readImageUrls(String json) {
        if (!StringUtils.hasText(json)) return new ArrayList<>();
        try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); }
        catch (Exception e) { return Arrays.stream(json.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList(); }
    }

    private String writeImageUrls(List<String> urls) {
        try { return objectMapper.writeValueAsString(urls); }
        catch (JsonProcessingException e) { throw new RuntimeException("이미지 URL 직렬화 실패", e); }
    }

    private List<String> readJsonArray(String json) {
        if (!StringUtils.hasText(json)) return new ArrayList<>();
        try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); }
        catch (Exception e) { return new ArrayList<>(); }
    }

    private List<Map<String, Object>> readListOfMaps(String json) {
        if (!StringUtils.hasText(json)) return new ArrayList<>();
        try { return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {}); }
        catch (Exception e) { return new ArrayList<>(); }
    }

    private String asStr(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private Integer toInt(Object o) {
        if (o == null) return null;
        try { if (o instanceof Number n) return n.intValue(); return Integer.parseInt(o.toString()); }
        catch (Exception e) { return null; }
    }
}
