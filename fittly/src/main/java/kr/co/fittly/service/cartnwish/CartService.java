// src/main/java/kr/co/fittly/service/cartnwish/CartService.java
package kr.co.fittly.service.cartnwish;

import kr.co.fittly.dto.cartnwish.CartResponse;
// [CHANGED] 옵션키 전용 DTO 추가
import kr.co.fittly.dto.cartnwish.CartOptionKey;

import kr.co.fittly.repository.cartnwish.CartItemRepository;
import kr.co.fittly.repository.cartnwish.CartRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.repository.product.ProductVariantRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.cartnwish.Cart;
import kr.co.fittly.vo.cartnwish.CartItem;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductVariant;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
// [ADDED] 로그용
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*; // [CHANGED] Java 8 호환: Collections.emptyList() 사용을 위해
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 장바구니 서비스
 * - 멱등 보장: 같은 (productId, color, size) 조합이 이미 있으면 추가하지 않음 (no-op)
 * - 동시성: DB 유니크 제약 (cart_id, product_id, opt_color, opt_size)
 * - 가격: discountPrice가 있으면 그것을 적용, 아니면 원가
 * - 수량: 재고 한도로 캡핑
 */
@Slf4j // [ADDED]
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // ✅ 변형/옵션 정보 조회용(색상이름/재고)
    private final ProductVariantRepository productVariantRepository;

    // ───────────────────────── public APIs ─────────────────────────

    /**
     * 장바구니 담기(옵션 포함 멱등, 재고 한도로 수량 캡핑)
     */
    @Transactional
    public void addToCart(String loginId, Long productId, Integer quantity, String color, String size) {
        final int reqQty = Math.max(1, quantity == null ? 1 : quantity);
        final String c = normalize(color);
        final String s = normalize(size);

        User user = findUserByLoginId(loginId);
        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> cartRepository.save(new Cart(user)));

        // [CHANGED] 정규화 비교 + 비관적 락으로 기존 항목 탐색 (pid+color+size)
        Optional<CartItem> lockFound = cartItemRepository.findForUpdateByCartProductAndOption(
                cart, findProductById(productId), c, s
        );
        if (lockFound.isPresent()) {
            // 멱등 요구사항: 이미 있으면 수량 추가 대신 no-op
            return;
        }

        Product product = findProductById(productId);

        // ✅ (product, color, size)로 색상이름/재고 추론
        VariantInfo vi = resolveVariant(product, c, s);

        // ✅ 재고 한도로 수량 캡핑(재고 정보가 있을 때만)
        int cappedQty = vi.availableStock != null
                ? Math.max(1, Math.min(reqQty, vi.availableStock))
                : reqQty;

        try {
            // colorName은 엔티티에 opt_color_name 컬럼이 있을 때만 보존
            CartItem item = new CartItem(cart, product, c, vi.colorName, s, cappedQty);
            // [CHANGED] 유니크 제약 에러를 이 지점에서 잡기 위해 flush는 서비스/트랜잭션 단위에 맡김
            cartItemRepository.save(item);
        } catch (DataIntegrityViolationException ignore) {
            // [CHANGED] 동시 요청 경합으로 유니크 위반 시 → 이미 존재하는 것으로 간주하고 no-op
        }
    }

    /** 내 장바구니 조회(할인가/재고/색상이름 포함 응답) */
    public List<CartResponse> getMyCart(String loginId) {
        User user = findUserByLoginId(loginId);

        List<CartItem> items = cartRepository.findByUser(user)
                // [CHANGED] Java 8 호환: List::of → Collections.emptyList()
                .map(cart -> cartItemRepository.findAllWithProductByCartId(cart.getId()))
                .orElseGet(Collections::emptyList); // [CHANGED]

        return items.stream()
                .map(ci -> {
                    Product p = ci.getProduct();
                    Integer appliedPrice = applyDiscountPrice(p);
                    VariantInfo vi = resolveVariant(p, ci.getColor(), ci.getSize());

                    // ✅ 권장: 확장된 CartResponse 팩토리 사용
                    return CartResponse.from(ci, appliedPrice, vi.availableStock, vi.colorName);
                })
                .collect(Collectors.toList());
    }

    /** 수량 변경(재고 한도로 캡핑) */
    @Transactional
    public void updateCartItemQuantity(String loginId, Long cartItemId, int quantity) {
        int req = Math.max(1, quantity);
        User user = findUserByLoginId(loginId);
        CartItem cartItem = findCartItemForUser(cartItemId, user);

        // 재고 조회 후 캡
        Product p = cartItem.getProduct();
        VariantInfo vi = resolveVariant(p, cartItem.getColor(), cartItem.getSize());
        int capped = vi.availableStock != null
                ? Math.max(1, Math.min(req, vi.availableStock))
                : req;

        cartItem.setQuantity(capped);
    }

    @Transactional
    public void removeCartItem(String loginId, Long cartItemId) {
        User user = findUserByLoginId(loginId);
        CartItem cartItem = findCartItemForUser(cartItemId, user);
        cartItemRepository.delete(cartItem);
    }

    /**
     * [DEPRECATED] 결제 후: productId 기준 일괄 삭제 (옵션 무시)
     * - 같은 상품의 다른 옵션까지 지워지는 부작용이 있어 더 이상 권장하지 않음.
     */
    @Deprecated // [CHANGED] 사용 중지 권장 — 옵션 단위 삭제 메서드로 교체
    @Transactional
    public void removeItemsAfterOrder(String loginId, List<Long> productIds) {
        // [CHANGED] 안전을 위해 NO-OP 처리 (레거시 경로 차단)
        log.warn("removeItemsAfterOrder(loginId={}, productIds={}) called but NO-OP. Use removeItemsAfterOrderByOptions().",
                loginId, productIds);
        // 과거 구현(옵션 무시 일괄 삭제)은 부작용 때문에 제거:
        // cartRepository.findByUser(user).ifPresent(cart ->
        //         cartItemRepository.deleteByCartIdAndProductIdIn(cart.getId(), productIds)
        // );
    }

    /**
     * [CHANGED] 결제 후: 옵션 키 목록(상품ID+color+size)으로 정확 삭제
     * - 구매된 옵션만 삭제하고, 같은 상품의 다른 옵션은 유지
     * - CartItemRepository의 '정규화 비교 삭제' 쿼리 활용
     */
    @Transactional
    public void removeItemsAfterOrderByOptions(String loginId, List<CartOptionKey> items) {
        if (items == null || items.isEmpty()) return;

        User user = findUserByLoginId(loginId);
        cartRepository.findByUser(user).ifPresent(cart -> {
            Long cartId = cart.getId();

            // [CHANGED] 레포지토리의 단건 정규화 삭제 메서드를 반복 호출 (벌크 메서드 의존 제거)
            for (CartOptionKey k : items) {
                if (k == null || k.getProductId() == null) continue;
                String color = normalize(k.getColor());
                String size  = normalize(k.getSize());

                int deleted = cartItemRepository.deleteByCartIdAndProductIdAndOptionNormalized(
                        cartId, k.getProductId(), color, size
                );

                if (deleted == 0) {
                    log.debug("removeItemsAfterOrderByOptions: not found (cartId={}, productId={}, color='{}', size='{}')",
                            cartId, k.getProductId(), color, size);
                }
            }
        });
    }

    // ───────────────────────── helpers ─────────────────────────

    private User findUserByLoginId(String loginId) {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. loginId: " + loginId));
    }

    private Product findProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. productId: " + productId));
    }

    /** 현재 사용자 소유의 CartItem인지 검증 */
    private CartItem findCartItemForUser(Long cartItemId, User user) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니 상품을 찾을 수 없습니다. cartItemId: " + cartItemId));
        if (!Objects.equals(cartItem.getCart().getUser().getId(), user.getId())) {
            throw new SecurityException("다른 사용자의 장바구니에 접근할 수 없습니다.");
        }
        return cartItem;
    }

    /** 옵션 문자열 정규화: null/빈문자 → null */
    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** 할인가 적용(있으면 할인, 없으면 원가) */
    private Integer applyDiscountPrice(Product p) {
        Integer dp = p.getDiscountPrice();
        if (dp != null && dp > 0) return dp;
        return p.getPrice();
    }

    // ───────────────────────── variant helpers ─────────────────────────

    /** 색상이름/재고 조회 결과 */
    private static class VariantInfo {
        final String colorName;          // 표시용 색상이름(없으면 null)
        final Integer availableStock;    // 재고(없으면 null)
        VariantInfo(String colorName, Integer availableStock) {
            this.colorName = colorName;
            this.availableStock = availableStock;
        }
    }

    /**
     * (product, color, size)로 우선 조회 → 없으면 (product, color)만으로 조회.
     * 실패해도 전체 흐름이 깨지지 않도록 try/catch 방어.
     */
    private VariantInfo resolveVariant(Product product, String color, String size) {
        String cn = null;
        Integer stock = null;

        String c = normalize(color);
        String s = normalize(size);

        if (productVariantRepository == null || c == null) {
            return new VariantInfo(null, null);
        }

        try {
            // 1) color+size 먼저
            Optional<ProductVariant> all =
                    productVariantRepository.findFirstByProductAndColorAndMaybeSize(product, c, s);
            if (all.isPresent()) {
                ProductVariant v = all.get();
                cn = nz(trimOrNull(v.getColorName()), cn);
                stock = v.getStock();
                return new VariantInfo(cn, stock);
            }

            // 2) color로만
            Optional<ProductVariant> byColor =
                    productVariantRepository.findFirstByProductAndColorNormalized(product, c);
            if (byColor.isPresent()) {
                ProductVariant v = byColor.get();
                cn = nz(trimOrNull(v.getColorName()), cn);
                stock = v.getStock();
                return new VariantInfo(cn, stock);
            }
        } catch (Exception ignore) {
            // 레포지토리 메서드가 없거나 실패해도 null 반환
        }

        return new VariantInfo(cn, stock);
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
    private static String nz(String a, String b) { return a != null ? a : b; }
}
