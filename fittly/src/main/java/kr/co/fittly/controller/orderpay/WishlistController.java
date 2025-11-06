package kr.co.fittly.controller.orderpay;

import kr.co.fittly.dto.cartnwish.WishlistResponse;
import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.service.cartnwish.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;


@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/user/wishlist", produces = MediaType.APPLICATION_JSON_VALUE)
public class WishlistController {

    private final WishlistService wishlistService;

    private static String requireUser(@AuthenticationPrincipal UserDetails user) {
        if (user == null) throw new ResponseStatusException(UNAUTHORIZED, "로그인이 필요합니다.");
        return user.getUsername();
    }

    private static String norm(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> list(
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        List<WishlistResponse> list = wishlistService.getWishlist(loginId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Void>> addJson(
            @RequestBody WishlistAddBody body,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        if (body == null || body.productId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "productId가 필요합니다.");
        }
        wishlistService.add(
                loginId,
                body.productId,
                norm(body.color),
                norm(body.size)
        );
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> addLegacyPath(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        wishlistService.add(loginId, productId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> removeQuery(
            @RequestParam Long productId,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String colorName,
            @RequestParam(required = false) String size,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        wishlistService.remove(
                loginId,
                productId,
                norm(color),
                norm(size)
        );
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeLegacyPath(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        wishlistService.remove(loginId, productId); // color/size = null
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/exists")
    public ResponseEntity<ApiResponse<Boolean>> exists(
            @RequestParam Long productId,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String colorName,
            @RequestParam(required = false) String size,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        boolean ok = wishlistService.exists(
                loginId,
                productId,
                norm(color),
                norm(size)
        );
        return ResponseEntity.ok(ApiResponse.ok(ok));
    }

    private record WishlistAddBody(Long productId, String color, String colorName, String size) {}
}
