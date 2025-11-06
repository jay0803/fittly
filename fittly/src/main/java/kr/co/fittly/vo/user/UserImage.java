package kr.co.fittly.vo.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_image")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserImage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "stored_name", nullable = false, length = 255)
    private String storedName;

    @Column(name = "url", nullable = false, length = 512)
    private String url; // "/uploads/..." 공개 경로

    @Column(name = "size")
    private Long size;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
