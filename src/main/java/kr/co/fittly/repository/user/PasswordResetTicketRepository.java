package kr.co.fittly.repository.user;

import kr.co.fittly.ticket.PasswordResetTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTicketRepository extends JpaRepository<PasswordResetTicket, Long> {
    Optional<PasswordResetTicket> findByToken(String token);
    Optional<PasswordResetTicket> findByTokenAndUsedFalse(String token);
    void deleteByExpiresAtBefore(LocalDateTime time);
}
