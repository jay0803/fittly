package kr.co.fittly.service.cartnwish;

import kr.co.fittly.dto.cartnwish.WishlistResponse;
import kr.co.fittly.repository.cartnwish.WishlistRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.repository.product.ProductVariantRepository; // ← 유지
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.cartnwish.Wishlist;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductVariant;                  // ← 유지
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository; // ← 주입

    // ───────────────────────── 유틸 ─────────────────────────
    private User getUserOrThrow(String loginId) {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 올바르지 않습니다."));
    }

    private Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."));
    }

    /** null/공백 → null, 나머지 trim */
    private String norm(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** 공백→"" 처리 후 대소문자 무시 비교 */
    private String cmp(String s) { return s == null ? "" : s.trim(); }
    private boolean ieq(String a, String b) { return cmp(a).equalsIgnoreCase(cmp(b)); }

    /**
     * (user, product, color, size)로 기존 위시 한 건 찾기 (대/소문자 무시)
     * - Repository에 아래 파생 메서드가 존재해야 합니다.
     *   Optional<Wishlist> findFirstByUserAndProductAndColorIgnoreCaseAndSizeIgnoreCase(User, Product, String, String);
     */
    private Optional<Wishlist> findExistingByOption(User user, Product product, String color, String size) {
        final String c = norm(color);
        final String s = norm(size);
        return wishlistRepository
                .findFirstByUserAndProductAndColorIgnoreCaseAndSizeIgnoreCase(user, product, c, s);
    }

    /**
     * colorName(표시용)이 비었으면 product_variant에서 보정(있으면)
     * - 실패/미지원이어도 기능에는 영향 없음
     */
    private String resolveColorName(Product product, String color, String size, String colorName) {
        String c  = norm(color);
        String cn = norm(colorName);
        String s  = norm(size);
        if (cn != null || c == null) return cn;

        try {
            Optional<ProductVariant> byAll =
                    variantRepository.findFirstByProductAndColorAndMaybeSize(product, c, s);
            if (byAll.isPresent()) return norm(byAll.get().getColorName());

            Optional<ProductVariant> byColorOnly =
                    variantRepository.findFirstByProductAndColorNormalized(product, c);
            return norm(byColorOnly.map(ProductVariant::getColorName).orElse(null));
        } catch (Exception ignore) {
            return null;
        }
    }

    // ───────────────────────── 서비스 ─────────────────────────

    @Override
    public List<WishlistResponse> getWishlist(String loginId) {
        User user = getUserOrThrow(loginId);
        return wishlistRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(WishlistResponse::new)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // 핵심 시그니처: (productId, color, size) 기준 멱등
    // =========================================================================

    /** 찜 추가 — 비교 키: (productId, color, size), colorName은 표시용만 반영 */
    @Override
    @Transactional
    public void add(String loginId, Long productId, String color, String size) {
        User user = getUserOrThrow(loginId);
        Product product = getProductOrThrow(productId);

        String c  = norm(color);
        String s  = norm(size);
        String cn = resolveColorName(product, c, s, null); // 표시용 색상명 보정

        // 멱등 체크
        Optional<Wishlist> existedOpt = findExistingByOption(user, product, c, s);
        if (existedOpt.isPresent()) {
            Wishlist w = existedOpt.get();
            if (!ieq(w.getColorName(), cn)) {
                w.setColorName(cn);
                wishlistRepository.save(w); // flush 강제 금지
            }
            return;
        }

        // 신규 저장 (중간 flush 금지)
        Wishlist w = Wishlist.builder()
                .user(user)
                .product(product)
                .color(c)
                .colorName(cn) // 표시용
                .size(s)
                .build();
        wishlistRepository.save(w);
    }

    /** 찜 해제 — 비교 키: (productId, color, size) */
    @Override
    @Transactional
    public void remove(String loginId, Long productId, String color, String size) {
        User user = getUserOrThrow(loginId);
        Product product = getProductOrThrow(productId);

        String c  = norm(color);
        String s  = norm(size);

        findExistingByOption(user, product, c, s)
                .ifPresent(wishlistRepository::delete);
    }

    /** 존재 여부 — 비교 키: (productId, color, size) */
    @Override
    public boolean exists(String loginId, Long productId, String color, String size) {
        User user = getUserOrThrow(loginId);
        Product product = getProductOrThrow(productId);

        String c  = norm(color);
        String s  = norm(size);
        return findExistingByOption(user, product, c, s).isPresent();
    }

    // =========================================================================
    // 하위 호환: colorName 포함 시그니처 → 내부적으로 colorName은 표시용만 갱신
    // =========================================================================

    @Transactional
    public void add(String loginId, Long productId, String color, String colorName, String size) {
        User user = getUserOrThrow(loginId);
        Product product = getProductOrThrow(productId);

        String c  = norm(color);
        String s  = norm(size);
        String cn = resolveColorName(product, c, s, colorName); // 표시용 색상명 보정

        Optional<Wishlist> existedOpt = findExistingByOption(user, product, c, s);
        if (existedOpt.isPresent()) {
            Wishlist w = existedOpt.get();
            if (!ieq(w.getColorName(), cn)) {
                w.setColorName(cn);
                wishlistRepository.save(w);
            }
            return;
        }

        Wishlist w = Wishlist.builder()
                .user(user)
                .product(product)
                .color(c)
                .colorName(cn) // 표시용
                .size(s)
                .build();
        wishlistRepository.save(w);
    }

    @Transactional
    public void remove(String loginId, Long productId, String color, String colorName, String size) {
        remove(loginId, productId, color, size); // 위임
    }

    public boolean exists(String loginId, Long productId, String color, String colorName, String size) {
        return exists(loginId, productId, color, size); // 위임
    }
}
