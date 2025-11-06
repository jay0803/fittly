package kr.co.fittly.vo.notice;

import jakarta.persistence.*;
import kr.co.fittly.vo.user.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "notices",
        indexes = {
                @Index(name = "idx_notices_pinned", columnList = "pinned"),
                @Index(name = "idx_notices_created_at", columnList = "created_at")
        }
)
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 작성자: 관리자(User). 권한 체크는 Security 단에서 처리
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    // 상단 고정 여부
    @Column(nullable = false)
    private boolean pinned = false;

    // 고정 정렬 우선순위(작을수록 위). 기본 0
    @Column(name = "pin_order", nullable = false)
    private int pinOrder = 0;

    // 조회수
    @Column(nullable = false)
    private long views = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (pinOrder < 0) pinOrder = 0;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
