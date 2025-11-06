package kr.co.fittly.repository.qna;

import kr.co.fittly.vo.qna.QnA;
import kr.co.fittly.vo.qna.QnaStatus;
import kr.co.fittly.vo.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface QnaRepository extends JpaRepository<QnA, Long> {

    Page<QnA> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<QnA> findByUserAndCreatedAtAfterOrderByCreatedAtDesc(User user, LocalDateTime from, Pageable pageable);

    Page<QnA> findByStatusOrderByCreatedAtDesc(QnaStatus status, Pageable pageable);

    Page<QnA> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<QnA> findByIdAndUser(Long id, User user);

    List<QnA> findByProductIdOrderByCreatedAtDesc(Long productId);
}
