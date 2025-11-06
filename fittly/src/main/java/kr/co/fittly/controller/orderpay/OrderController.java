package kr.co.fittly.controller.orderpay;

import kr.co.fittly.dto.order.OrderItemResponse;
import kr.co.fittly.dto.order.OrderResponse;
import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.service.order.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/user/orders", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
public class OrderController {

    private final OrderService orderService;

    private static String requireUser(@AuthenticationPrincipal UserDetails user) {
        if (user == null) throw new ResponseStatusException(UNAUTHORIZED, "로그인이 필요합니다.");
        String loginId = user.getUsername();
        if (loginId == null || loginId.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "인증 정보가 올바르지 않습니다.");
        }
        return loginId;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        List<OrderResponse> orders = orderService.findMyOrders(loginId);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/{orderUid}/items")
    public ResponseEntity<ApiResponse<List<OrderItemResponse>>> getOrderItems(
            @PathVariable String orderUid,
            @AuthenticationPrincipal UserDetails user
    ) {
        String loginId = requireUser(user);
        var items = orderService.findMyOrderItems(loginId, orderUid);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/{orderUid}")
    public ApiResponse<OrderResponse> getOrderDetail(@AuthenticationPrincipal UserDetails user,
                                                     @PathVariable String orderUid) {
        return ApiResponse.ok(orderService.findByOrderUid(orderUid, user.getUsername()));
    }

}
