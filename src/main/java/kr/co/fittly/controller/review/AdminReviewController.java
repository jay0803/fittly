package kr.co.fittly.controller.review;

import kr.co.fittly.dto.review.AdminReviewResponse;
import kr.co.fittly.repository.review.ReviewRepository;
import kr.co.fittly.service.review.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewRepository reviewRepository;
    private final ReviewService reviewService;

    /** ✅ 관리자용 리뷰 전체 조회 */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<AdminReviewResponse>> getAllReviews() {
        List<AdminReviewResponse> result = reviewRepository.findAll().stream()
                .map(r -> AdminReviewResponse.builder()
                        .id(r.getRid())
                        .userName(r.getUser() != null ? r.getUser().getName() : "탈퇴 회원")
                        .userId(r.getUser() != null ? r.getUser().getLoginId() : "-")
                        .brand(r.getProduct() != null ? r.getProduct().getBrand() : "-")
                        .productName(r.getProduct() != null ? r.getProduct().getName() : "상품 정보 없음")
                        .rating(r.getRating())
                        .content(r.getContent())
                        .imageUrls(r.getImages() != null
                                ? r.getImages().stream()
                                .map(img -> img.getImageUrl())
                                .collect(Collectors.toList())
                                : List.of())
                        .createdAt(r.getCreatedAt())
                        .build()
                )
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /** ✅ 리뷰 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable("id") Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
