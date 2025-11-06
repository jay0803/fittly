// src/main/java/kr/co/fittly/ticket/EmailVerifyCode.java
package kr.co.fittly.ticket;

import jakarta.persistence.*;
import kr.co.fittly.vo.user.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "email_verify_code", indexes = {
        @Index(name = "idx_evc_email_created", columnList = "email, created_at"),
        @Index(name = "idx_evc_user",          columnList = "user_id")
})
public class EmailVerifyCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 유저 연관: 선택(Nullable) — 계정 생성 전 인증을 허용
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id",
            foreignKey = @ForeignKey(name = "fk_evc_user"))
    private User user;

    @Column(name = "email", nullable = false, length = 180)
    private String email;

    @Column(name = "code", nullable = false, length = 6)
    private String code;

    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public EmailVerifyCode(String email, String code, LocalDateTime now, LocalDateTime expiresAt) {
        this.email = email;
        this.code = code;
        this.createdAt = now;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired(LocalDateTime now) { return expiresAt.isBefore(now); }
    public boolean isUsed() { return usedAt != null; }
    public void markUsed(LocalDateTime now) { this.usedAt = now; }
    public void addAttempt() { this.attempts++; }
}
