package kr.co.fittly.vo.user;

import jakarta.persistence.*;
import kr.co.fittly.vo.product.FashionStyle;
import kr.co.fittly.vo.product.ProductCategory;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user_profile")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;  // 기존 users 테이블 엔티티 (kr.co.fittly.vo.user.User)

    // ── AI 분석 결과
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private BodyType aiBodyType;   // AI가 분석한 체형

    @Column(columnDefinition = "TEXT")
    private String aiStyleScoresJson;  // AI가 계산한 스타일 점수 JSON

    private LocalDateTime aiLastAnalyzedAt;  // 마지막 분석 시각

    // ── 신체정보(선택, 유저 입력)
    private Integer heightCm;
    private Integer weightKg;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private BodyType bodyType;  // 사용자가 선택한 체형

    @Column(length = 50)
    private String hairstyle;

    @Column(length = 20)
    private String hairstylePreset;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    void touch() { this.updatedAt = LocalDateTime.now(); }

    // ── 선호 스타일(다대다)
    @ManyToMany
    @JoinTable(
            name = "user_fashion_style",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "style_code", referencedColumnName = "code")
    )
    @Builder.Default
    private Set<FashionStyle> fashionStyles = new HashSet<>();

    // ── 노출 희망 카테고리(다대다)
    @ManyToMany
    @JoinTable(
            name = "user_pref_category",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "category_code", referencedColumnName = "code")
    )
    @Builder.Default
    private Set<ProductCategory> preferredCategories = new HashSet<>();

    public enum BodyType { SLIM, NORMAL, MUSCULAR, CHUBBY, OTHER }
}
