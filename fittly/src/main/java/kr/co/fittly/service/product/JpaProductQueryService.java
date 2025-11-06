package kr.co.fittly.service.product;

import kr.co.fittly.dto.product.ProductLatestResponse;
import kr.co.fittly.repository.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class JpaProductQueryService implements ProductQueryService {

    private final ProductRepository productRepo;

    @Override
    public List<ProductLatestResponse> findCandidates(String categoryCode, List<String> styleCodes, int limit) {
        final int top = Math.max(1, (limit <= 0 ? 8 : limit));
        final Pageable page = PageRequest.of(0, top);

        if (styleCodes == null || styleCodes.isEmpty()) {
            return productRepo.findCategoryTopProducts(categoryCode, page);
        }

        List<ProductLatestResponse> primary =
                productRepo.findCategoryTopProductsByStyles(categoryCode, styleCodes, page);

        if (primary.size() < top) {
            List<Long> excludeIds = primary.stream()
                    .map(ProductLatestResponse::getId)
                    .collect(Collectors.toList());
            int remain = top - primary.size();

            List<ProductLatestResponse> fallback = excludeIds.isEmpty()
                    ? productRepo.findCategoryTopProducts(categoryCode, PageRequest.of(0, remain))
                    : productRepo.findCategoryTopProductsExcluding(categoryCode, excludeIds, PageRequest.of(0, remain));

            return Stream.concat(primary.stream(), fallback.stream())
                    .limit(top)
                    .collect(Collectors.toList());
        }
        return primary;
    }
}
