package kr.co.fittly.service.product;

import kr.co.fittly.dto.product.ProductLatestResponse;

import java.util.List;

public interface ProductQueryService {
    List<ProductLatestResponse> findCandidates(String categoryCode, List<String> styleCodes, int limit);
}
