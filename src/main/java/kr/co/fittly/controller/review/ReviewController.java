package kr.co.fittly.controller.review;

import jakarta.servlet.http.HttpServletRequest;
import kr.co.fittly.dto.review.ReviewAvailableResponse;
import kr.co.fittly.dto.review.ReviewRequest;
import kr.co.fittly.dto.review.ReviewResponse;
import kr.co.fittly.security.JwtUtil;
import kr.co.fittly.service.review.ReviewService;
import kr.co.fittly.vo.review.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtUtil jwtUtil;

    /** ✅ 리뷰 등록 */
    @PostMapping
    public ResponseEntity<Review> createReview(
            HttpServletRequest req,
            @ModelAttribute ReviewRequest dto,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {
        String token = jwtUtil.stripBearer(req.getHeader("Authorization"));
        Long userId = jwtUtil.extractUserId(token);
        Review savedReview = reviewService.createReview(userId, dto, images);
        return ResponseEntity.ok(savedReview);
    }

    /** ✅ 상품별 리뷰 목록 */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getProductReviews(@PathVariable Long productId) {
        var reviews = reviewService.getProductReviews(productId); // ✅ map 제거
        return ResponseEntity.ok(reviews);
    }

    /** ✅ 내가 작성한 리뷰 목록 */
    @GetMapping("/me")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(HttpServletRequest req) {
        String token = jwtUtil.stripBearer(req.getHeader("Authorization"));
        Long userId = jwtUtil.extractUserId(token);

        var reviews = reviewService.getMyReviews(userId); // ✅ 이미 DTO
        return ResponseEntity.ok(reviews);
    }

    /** ✅ 작성 가능한 후기 목록 */
    @GetMapping("/available")
    public ResponseEntity<List<ReviewAvailableResponse>> getAvailableReviews(HttpServletRequest req) {
        String token = jwtUtil.stripBearer(req.getHeader("Authorization"));
        Long userId = jwtUtil.extractUserId(token);

        var available = reviewService.getAvailableReviews(userId)
                .stream()
                .map(ReviewAvailableResponse::from)
                .toList();

        return ResponseEntity.ok(available);
    }
}
