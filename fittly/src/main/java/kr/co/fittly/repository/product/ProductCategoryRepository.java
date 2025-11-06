package kr.co.fittly.repository.product;

import kr.co.fittly.vo.product.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, String> {
    List<ProductCategory> findByCodeIn(Collection<String> codes);
    List<ProductCategory> findByLabelIn(Collection<String> labels);
    Optional<ProductCategory> findByLabel(String label);
}
