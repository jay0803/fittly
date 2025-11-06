package kr.co.fittly.vo.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import kr.co.fittly.ticket.EmailVerifyCode;
import kr.co.fittly.ticket.PasswordResetTicket;

@Getter
@Setter
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"login_id"}),
                @UniqueConstraint(columnNames = {"email"})
        }
)
// 🔒 Lazy 로딩된 연관 필드 직렬화 방지 (무한루프, no session 방지)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", nullable = false, length = 32, unique = true)
    private String loginId;

    /** BCrypt 해시 (길이 60, 여유롭게 100으로 지정) */
    @Column(name = "password", nullable = false, length = 100)
    private String password;

    @Column(name = "email", nullable = false, length = 120, unique = true)
    private String email;

    @Column(name = "name", length = 50)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "zipcode", length = 10)
    private String zipcode;

    @Column(name = "address1", length = 255)
    private String address1;

    @Column(name = "address2", length = 255)
    private String address2;

    /** 권한 기본값: ROLE_USER */
    @Column(name = "role", nullable = false, length = 30)
    private String role = "ROLE_USER";

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* =========================
       연관관계 (읽기 전용)
       ========================= */

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore // 🚫 세션 종료 후 Lazy 로딩 문제 차단
    private List<UserImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<EmailVerifyCode> emailVerifyCodes = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PasswordResetTicket> passwordResetTickets = new ArrayList<>();

    /* =========================
       생성자
       ========================= */
    public User(String loginId, String password, String email) {
        this.loginId = loginId;
        this.password = password;
        this.email = email;
        this.role = "ROLE_USER";
    }

    public User(String loginId, String password, String email, String name) {
        this(loginId, password, email);
        this.name = name;
    }

    /* =========================
       상태 변경
       ========================= */
    public void markEmailAsVerified() {
        this.emailVerified = true;
    }

    /* =========================
       양방향 편의 메서드
       ========================= */
    public void addImage(UserImage image) {
        if (image == null) return;
        this.images.add(image);
        image.setUser(this);
    }

    public void addEmailVerifyCode(EmailVerifyCode code) {
        if (code == null) return;
        this.emailVerifyCodes.add(code);
        code.setUser(this);
    }

    public void addPasswordResetTicket(PasswordResetTicket ticket) {
        if (ticket == null) return;
        this.passwordResetTickets.add(ticket);
        ticket.setUser(this);
    }
}
