package kr.co.fittly.service.review;

import kr.co.fittly.dto.review.ReviewRequest;
import kr.co.fittly.dto.review.ReviewResponse;
import kr.co.fittly.repository.order.OrderItemRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.repository.review.ReviewImageRepository;
import kr.co.fittly.repository.review.ReviewRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.order.OrderItem;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.review.Review;
import kr.co.fittly.vo.review.ReviewImage;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    // 251021_영미 추가
    @Value("${fittly.upload-dir:C:/uploads}")
    private String imageUrl;

    /** ✅ 리뷰 등록 */
    public Review createReview(Long userId, ReviewRequest req, List<MultipartFile> files) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품 정보를 찾을 수 없습니다."));

        OrderItem orderItem = orderItemRepository.findByIdWithOrder(req.getOrderItemId())
                .orElseThrow(() -> new IllegalArgumentException("주문 상품 정보를 찾을 수 없습니다."));

        if (reviewRepository.existsByOrderItem(orderItem)) {
            throw new IllegalStateException("이미 해당 주문 상품에 대한 리뷰가 존재합니다.");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .order(orderItem.getOrder())
                .orderItem(orderItem)
                .rating(req.getRating())
                .content(req.getContent())
                .height(req.getHeight())
                .weight(req.getWeight())
                .sex(req.getSex())
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);

        // ✅ 이미지 업로드 처리
        if (files != null && !files.isEmpty()) {
            Path uploadPath = Paths.get(imageUrl+"/reviews"); // 251021_영미 수정
            Files.createDirectories(uploadPath);

            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    Path filePath = uploadPath.resolve(filename);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                    ReviewImage img = ReviewImage.builder()
                            .review(saved)
                            .imageUrl("/uploads/reviews/" + filename)  // 251021_영미 수정
                            .build();

                    reviewImageRepository.save(img);
                }
            }
        }

        return saved;
    }

    /** ✅ 내가 작성한 리뷰 목록 (color/size 자동 포함) */
    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(Long userId) {
        List<Review> reviews = reviewRepository.findByUserIdWithOrderItemFetchJoin(userId);

        return reviews.stream()
                .map(r -> ReviewResponse.from(r))
                .collect(Collectors.toList());
    }

    /** ✅ 작성 가능한 후기 목록 */
    @Transactional(readOnly = true)
    public List<OrderItem> getAvailableReviews(Long userId) {
        List<OrderItem> items = orderItemRepository.findByUserIdAndReviewIsNull(userId);

        // ⚡ Lazy 로딩된 product/order 강제 초기화
        for (OrderItem oi : items) {
            if (oi.getProduct() != null) {
                oi.getProduct().getName();
                oi.getProduct().getBrand();
                oi.getProduct().getThumbnailUrl();
            }
            if (oi.getOrder() != null) {
                oi.getOrder().getCreatedAt();
            }
        }

        return items;
    }

    /** ✅ 상품별 리뷰 목록 (ReviewList용) */
    @Transactional(readOnly = true)
    public List<ReviewResponse> getProductReviews(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdFetchJoin(productId);

        return reviews.stream()
                .map(r -> ReviewResponse.from(r))
                .collect(Collectors.toList());
    }

    /** ✅ 리뷰 삭제 (관리자/사용자 공용) */
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰가 존재하지 않습니다."));
        reviewRepository.delete(review);
    }
}
