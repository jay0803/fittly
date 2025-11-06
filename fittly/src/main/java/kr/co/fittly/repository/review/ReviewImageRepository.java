package kr.co.fittly.repository.review;

import kr.co.fittly.vo.review.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {

    /** ✅ 특정 리뷰에 속한 이미지 조회 */
    List<ReviewImage> findByReview_Rid(Long reviewId);
}
