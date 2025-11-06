package kr.co.fittly.dto.review;

import kr.co.fittly.vo.review.Review;
import kr.co.fittly.vo.review.ReviewImage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class ReviewResponse {

    private Long id;
    private int rating;
    private String content;
    private String sex;
    private Integer height;
    private Integer weight;
    private LocalDateTime createdAt;

    private String userName;

    private Long productId;
    private String productName;
    private String productBrand;
    private String thumbnailUrl;

    // ✅ 구매옵션
    private String color;
    private String size;

    private List<String> images;

    public static ReviewResponse from(Review review) {
        if (review == null) return null;

        var product = review.getProduct();
        var user = review.getUser();
        var orderItem = review.getOrderItem();

        return ReviewResponse.builder()
                .id(review.getRid())
                .rating(review.getRating())
                .content(review.getContent())
                .sex(review.getSex())
                .height(review.getHeight())
                .weight(review.getWeight())
                .createdAt(review.getCreatedAt())
                .userName(user != null ? user.getName() : "익명")
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .productBrand(product != null ? product.getBrand() : null)
                .thumbnailUrl(product != null ? product.getThumbnailUrl() : null)
                // ✅ HEX → 한글 자동 변환
                .color(orderItem != null ? convertColor(orderItem.getColor()) : null)
                .size(orderItem != null ? orderItem.getSize() : null)
                .images(review.getImages() != null
                        ? review.getImages().stream()
                        .map(ReviewImage::getImageUrl)
                        .collect(Collectors.toList())
                        : List.of())
                .build();
    }

    /** ✅ 색상 자동 변환 메서드 */
    private static String convertColor(String color) {
        if (color == null) return null;
        String c = color.trim().toLowerCase();

        return switch (c) {
            case "#000000", "000000" -> "블랙";
            case "#808080", "808080" -> "그레이";
            case "#a9a9a9", "a9a9a9" -> "차콜 그레이";
            case "#ffffff", "ffffff" -> "화이트";
            case "#c0c0c0", "c0c0c0" -> "실버";
            case "#ff0000", "ff0000" -> "레드";
            case "#0000ff", "0000ff" -> "블루";
            case "#008000", "008000" -> "그린";
            default -> color; // 매핑되지 않으면 원본 그대로
        };
    }
}
