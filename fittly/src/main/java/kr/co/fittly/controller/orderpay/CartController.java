package kr.co.fittly.controller.orderpay;

import jakarta.validation.Valid;
import kr.co.fittly.dto.cartnwish.CartRequest;
import kr.co.fittly.dto.cartnwish.CartResponse;
import kr.co.fittly.dto.cartnwish.UpdateCartQuantityRequest;
// [CHANGED] 옵션 키 전용 DTO 임포트 (결제 후 정확 삭제용)
import kr.co.fittly.dto.cartnwish.CartOptionKey;
import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.service.cartnwish.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/user/cart", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class CartController {

    private final CartService cartService;
    private static String requireUser(@AuthenticationPrincipal UserDetails user) {
        if (user == null) throw new ResponseStatusException(UNAUTHORIZED, "로그인이 필요합니다.");
        return user.getUsername();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartResponse>>> getMyCart(
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        List<CartResponse> myCart = cartService.getMyCart(loginId);
        return ResponseEntity.ok(ApiResponse.ok(myCart));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Boolean>> addToCart(
            @Valid @RequestBody CartRequest request,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);

        Long productId = request.getProductId();
        Integer qty = request.getQuantity();
        if (productId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "productId가 필요합니다.");
        }
        int quantity = (qty == null || qty < 1) ? 1 : qty;
        cartService.addToCart(loginId, productId, quantity, request.getColor(), request.getSize());
        return ResponseEntity.ok(ApiResponse.ok(true));
    }

    @PatchMapping(value = "/{cartItemId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Boolean>> updateQuantity(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartQuantityRequest request,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        Integer qty = request.getQuantity();
        if (qty == null || qty < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "수량은 1 이상이어야 합니다.");
        }
        cartService.updateCartItemQuantity(loginId, cartItemId, qty);
        return ResponseEntity.ok(ApiResponse.ok(true));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<Boolean>> removeItem(
            @PathVariable Long cartItemId,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        cartService.removeCartItem(loginId, cartItemId);
        return ResponseEntity.ok(ApiResponse.ok(true));
    }

    @PostMapping(value = "/remove-after-order-options", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Boolean>> removeAfterOrderByOptions(
            @RequestBody List<CartOptionKey> items,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        cartService.removeItemsAfterOrderByOptions(loginId, items); // [CHANGED] 옵션 단위 삭제 호출
        return ResponseEntity.ok(ApiResponse.ok(true));
    }

    @Deprecated
    @PostMapping(value = "/remove-after-order", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Boolean>> removeAfterOrder(
            @RequestBody List<Long> productIds,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        cartService.removeItemsAfterOrder(loginId, productIds);
        return ResponseEntity.ok(ApiResponse.ok(true));
    }
}
