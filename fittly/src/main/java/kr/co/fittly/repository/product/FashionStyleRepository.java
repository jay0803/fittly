package kr.co.fittly.repository.product;

import kr.co.fittly.vo.product.FashionStyle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FashionStyleRepository extends JpaRepository<FashionStyle, String> {
    List<FashionStyle> findByCodeIn(Collection<String> codes);
    List<FashionStyle> findByLabelIn(Collection<String> labels);
    Optional<FashionStyle> findByLabel(String label);
}
