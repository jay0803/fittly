package kr.co.fittly.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductVariant;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDetailResponse {

    private Long id;
    private String productCode;
    private String brand;
    private String name;

    private String category;
    private String description;

    private String color;
    private String colorNames;

    private String material;
    private String styleCode;
    private String tags;

    private Integer price;
    private Integer discountPrice;
    private Integer discountRate;

    private int stock;
    private String status;
    private LocalDateTime releaseDate;

    private String thumbnailUrl;
    private List<String> imageUrls;

    private List<SizeDto> sizes;
    private List<ColorSizesDto> colorSizes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String videoUrl;
    private BigDecimal averageRating;
    private Integer reviewCount;
    private Integer salesCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SizeDto {
        private String size;
        private Integer stock;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColorSizesDto {
        private String color;
        private String colorName;
        private List<SizeDto> sizes;
    }

    public static ProductDetailResponse of(Product p, List<ProductVariant> variants) {
        ObjectMapper mapper = new ObjectMapper();
        List<String> images = List.of();
        if (p.getImageUrls() != null && !p.getImageUrls().isBlank()) {
            try {
                images = mapper.readValue(p.getImageUrls(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                images = List.of();
            }
        }

        int priceInt = p.getPrice();
        Integer dp = p.getDiscountPrice();
        Integer rate = p.getDiscountRate();

        if (dp == null && rate != null && priceInt > 0) {
            dp = Math.max(0, (int) Math.round(priceInt * (1 - rate / 100.0)));
        }
        if (rate == null && priceInt > 0 && dp != null) {
            int r = (int) Math.round((1 - (dp / (double) priceInt)) * 100);
            rate = clamp(r, 0, 100);
        }

        ProductDetailResponse dto = ProductDetailResponse.builder()
                .id(p.getId())
                .productCode(p.getProductCode())
                .brand(p.getBrand())
                .name(p.getName())
                .category(p.getCategory() != null ? p.getCategory().getCode() : null)
                .description(p.getDescription())
                .material(p.getMaterial())
                .styleCode(p.getStyle() != null ? p.getStyle().getCode() : null)
                .tags(p.getTags())
                .price(priceInt)
                .discountPrice(dp)
                .discountRate(rate)
                .thumbnailUrl(p.getThumbnailUrl())
                .videoUrl(p.getVideoUrl())
                .averageRating(p.getAverageRating())
                .reviewCount(p.getReviewCount())
                .salesCount(p.getSalesCount())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .releaseDate(p.getReleaseDate())
                .status(p.getStatus() != null ? p.getStatus().name() : "SALE")
                .stock(p.getStock())
                .imageUrls(images)
                .build();

        if (variants != null && !variants.isEmpty()) {
            dto.setColor(variants.get(0).getColor());

            Map<String, List<ProductVariant>> byColor = variants.stream()
                    .collect(Collectors.groupingBy(
                            ProductVariant::getColor,
                            LinkedHashMap::new,
                            Collectors.toList()
                    ));

            List<ColorSizesDto> colorBlocks = new ArrayList<>();
            List<String> colorNameCollect = new ArrayList<>();

            for (Map.Entry<String, List<ProductVariant>> e : byColor.entrySet()) {
                String colorHex = e.getKey();

                String colorName = e.getValue().stream()
                        .map(ProductVariant::getColorName)
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .findFirst()
                        .orElse(null);

                List<SizeDto> sizeList = e.getValue().stream()
                        .sorted(Comparator.comparing(ProductVariant::getSize, String.CASE_INSENSITIVE_ORDER))
                        .map(v -> new SizeDto(
                                v.getSize(),
                                Optional.ofNullable(v.getStock()).orElse(0)
                        ))
                        .collect(Collectors.toList());

                colorBlocks.add(new ColorSizesDto(colorHex, colorName, sizeList));

                if (colorName != null && !colorName.isBlank()) {
                    colorNameCollect.add(colorName);
                }
            }

            dto.setColorSizes(colorBlocks);

            if (!colorNameCollect.isEmpty()) {
                List<String> dedup = new ArrayList<>(new LinkedHashSet<>(colorNameCollect));
                dto.setColorNames(String.join(",", dedup));
            }
        }

        return dto;
    }

    public static ProductDetailResponse of(Product p) {
        return of(p, Collections.emptyList());
    }

    private static int clamp(int v, int min, int max) {
        return Math.min(Math.max(v, min), max);
    }
}
