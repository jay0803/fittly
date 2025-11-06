package kr.co.fittly.vo.review;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ✅ 업로드된 리뷰 이미지 경로
     * 예: "/uploads/reviews/2025/10/16/abc123.png"
     */
    private String imageUrl;

    /** ✅ 리뷰와 다대일 관계 (여러 이미지가 하나의 리뷰에 속함)
     * 순환참조 방지를 위해 반드시 @JsonIgnore 추가
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private Review review;
}