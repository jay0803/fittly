package kr.co.fittly.repository.faq;

import kr.co.fittly.vo.faq.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FaqRepository extends JpaRepository<Faq, Long>, JpaSpecificationExecutor<Faq> {
}
