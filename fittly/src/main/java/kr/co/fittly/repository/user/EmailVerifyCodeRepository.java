
package kr.co.fittly.repository.user;

import kr.co.fittly.ticket.EmailVerifyCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailVerifyCodeRepository extends JpaRepository<EmailVerifyCode, Long> {

    Optional<EmailVerifyCode> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<EmailVerifyCode> findTopByEmailAndUsedAtIsNullOrderByCreatedAtDesc(String email);

    boolean existsByEmailAndUsedAtIsNotNullAndCreatedAtAfter(String email, LocalDateTime after);

    void deleteByEmailAndExpiresAtBefore(String email, LocalDateTime time);

    long countByEmailAndCreatedAtAfter(String email, LocalDateTime after);
}
