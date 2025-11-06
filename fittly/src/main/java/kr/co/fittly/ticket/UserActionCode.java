package kr.co.fittly.ticket;

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
@Table(name = "user_tokens")
public class UserActionCode {
    public enum Kind {
        VERIFY_EMAIL_OTP,   // ← DB에 맞춤
        PHONE_OTP,
        TWO_FACTOR,
        INVITE,
        PASSWORD_RESET
    }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private Kind type;

    @Column(name = "token", nullable = false, length = 255)
    private String token;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @Transient
    public boolean isExpired() { return expiresAt != null && Instant.now().isAfter(expiresAt); }

    @Transient
    public boolean isUsed() { return usedAt != null; }

    public void markUsed() { this.usedAt = Instant.now(); }

    public void incAttempts() { this.attempts++; }
}
