// src/main/java/kr/co/fittly/repository/product/ProductTagSearchRepository.java
package kr.co.fittly.repository.product;

import kr.co.fittly.vo.product.Product;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductTagSearchRepository extends Repository<Product, Long> {

    // tags 컬럼은 "태그1,태그2,태그3" 형태라고 가정
    @Query(value = """
      SELECT * FROM product p
      WHERE (:t1 IS NULL OR FIND_IN_SET(:t1, REPLACE(p.tags,' ','')) > 0)
        AND (:t2 IS NULL OR FIND_IN_SET(:t2, REPLACE(p.tags,' ','')) > 0)
        AND (:t3 IS NULL OR FIND_IN_SET(:t3, REPLACE(p.tags,' ','')) > 0)
      ORDER BY p.id DESC
      """, nativeQuery = true)
    List<Product> findByTagsAND(
            @Param("t1") String t1,
            @Param("t2") String t2,
            @Param("t3") String t3
    );
}
