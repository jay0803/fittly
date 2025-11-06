
package kr.co.fittly.controller.orderpay;

import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.dto.payment.PaymentCallbackRequest;
import kr.co.fittly.dto.order.OrderResponse;
import kr.co.fittly.service.pay.PaymentService;
import kr.co.fittly.dto.cartnwish.CartOptionKey;
import kr.co.fittly.service.cartnwish.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.Collections;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/pay", produces = MediaType.APPLICATION_JSON_VALUE)
public class PaymentController {

    private final PaymentService paymentService;
    private final CartService cartService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<OrderResponse>> verifyAndCreateOrder(
            @Valid @RequestBody PaymentCallbackRequest request,
            @AuthenticationPrincipal UserDetails user
    ) {
        OrderResponse res = paymentService.verifyAndProcessPayment(request, user.getUsername());
        try {
            final String loginId = user.getUsername();
            List<PaymentCallbackRequest.Product> products =
                    (request.getProducts() != null)
                            ? request.getProducts()
                            : Collections.emptyList();

            List<CartOptionKey> optionItems = products.stream()
                    .filter(Objects::nonNull)
                    .map(p -> CartOptionKey.builder()
                            .productId(p.getProductId())
                            .color(nz(p.getColor()))
                            .size(nz(p.getSize()))
                            .build())
                    .collect(Collectors.toList());

            cartService.removeItemsAfterOrderByOptions(loginId, optionItems);
        } catch (Exception ignore) {
        }

        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PermitAll
    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Void>> webhook(@RequestBody String body) {
        paymentService.handleWebhook(body);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private static String nz(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
