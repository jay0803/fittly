// src/main/java/kr/co/fittly/service/pay/PaymentServiceImpl.java
package kr.co.fittly.service.pay;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import kr.co.fittly.dto.order.OrderResponse;
import kr.co.fittly.dto.payment.PaymentCallbackRequest;
import kr.co.fittly.dto.payment.PaymentReadyResponse;
import kr.co.fittly.repository.cartnwish.CartItemRepository;
import kr.co.fittly.repository.cartnwish.CartRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.service.order.OrderService;
import kr.co.fittly.vo.cartnwish.Cart;
import kr.co.fittly.vo.cartnwish.CartItem;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final OrderService orderService;
    private final ObjectMapper om;

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    /** 고정 배송비(필요 시 무료배송 임계치와 함께 사용) */
    private static final int SHIPPING_FEE = 3000;
    // private static final int FREE_SHIPPING_THRESHOLD = 50000;

    private User userOr401(String loginId) {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."));
    }

    /** 할인가 우선 단가 */
    private int unitPrice(Product p) {
        Integer d = p.getDiscountPrice();
        if (d != null && d > 0) return d;
        Integer n = p.getPrice();
        return n == null ? 0 : Math.max(0, n);
    }

    private String newMerchantUid() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        return "ORD-" + ts + "-" + UUID.randomUUID().toString().substring(0, 6);
    }

    // ───────────── 결제 준비(요청의 products 기준) ─────────────
    @Override
    @Transactional(readOnly = true)
    public PaymentReadyResponse ready(PaymentCallbackRequest request, String loginId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 없습니다.");
        }
        userOr401(loginId);

        if (request.getProducts() == null || request.getProducts().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제할 상품 목록이 비어 있습니다.");
        }

        // 1) 서버 계산: 할인가 우선 상품 합계
        int itemsSum = 0;
        // [CHANGED] ProductInfo → Product
        for (PaymentCallbackRequest.Product pi : request.getProducts()) {
            if (pi == null || pi.getProductId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상품 정보가 올바르지 않습니다.");
            }
            Product prod = productRepository.findById(pi.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "상품을 찾을 수 없습니다: " + pi.getProductId()));
            int each = unitPrice(prod);
            int qty  = Math.max(1, pi.getQuantity());
            itemsSum += each * qty;
        }
        if (itemsSum <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 금액이 0원 이하입니다. 다시 확인해주세요.");
        }

        // 2) 배송비 계산(고정 3,000원; 정책이 있으면 임계치 적용)
        // int shipping = (itemsSum >= FREE_SHIPPING_THRESHOLD) ? 0 : SHIPPING_FEE;
        int shipping = SHIPPING_FEE;

        int amount = itemsSum + shipping;
        String merchantUid = newMerchantUid();

        return PaymentReadyResponse.builder()
                .merchantUid(merchantUid)
                .amount(amount) // ✅ 배송비 포함 최종금액
                .build();
    }

    // ───────────── 검증 + 주문 생성 ─────────────
    @Override
    @Transactional
    public OrderResponse verifyAndProcessPayment(PaymentCallbackRequest request, String loginId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 없습니다.");
        }
        User user = userOr401(loginId);

        // 1) 서버 재계산(할인가 우선)
        int itemsSum = 0;
        if (request.getProducts() != null) {
            // [CHANGED] ProductInfo → Product
            for (PaymentCallbackRequest.Product p : request.getProducts()) {
                if (p == null || p.getProductId() == null) continue;
                Product prod = productRepository.findById(p.getProductId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "상품을 찾을 수 없습니다: " + p.getProductId()));
                int priceEach = unitPrice(prod);
                int qty       = Math.max(1, p.getQuantity());
                itemsSum += priceEach * qty;
            }
        }
        if (itemsSum <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 금액이 0원 이하입니다. 다시 확인해주세요.");
        }

        // 2) 배송비 동일 로직 적용
        // int shipping = (itemsSum >= FREE_SHIPPING_THRESHOLD) ? 0 : SHIPPING_FEE;
        int shipping = SHIPPING_FEE;

        int serverSum = itemsSum + shipping;

        // 3) (완화) 클라이언트/PG 금액 불일치 시 차단하지 않고 서버값을 신뢰
        Integer clientAmount = request.getAmount();
        if (clientAmount != null && clientAmount.intValue() != serverSum) {
            // 여기서 400을 던지지 않습니다. 서버 재계산(serverSum)을 단일 진실로 기록합니다.
            // 필요하면 로깅만 남기세요.
            // log.warn("Client amount({}) != Server sum({}) for {}", clientAmount, serverSum, request.getMerchantUid());
        }

        // 4) 결제정보(서버 계산값을 단일 진실로 기록)
        ObjectNode paymentInfo = om.createObjectNode();
        paymentInfo.put("amount", serverSum);
        paymentInfo.put("itemsSum", itemsSum);
        paymentInfo.put("shippingFee", shipping);
        if (request.getMerchantUid() != null) paymentInfo.put("merchantUid", request.getMerchantUid());
        if (request.getImpUid() != null)      paymentInfo.put("impUid", request.getImpUid());
        if (clientAmount != null)             paymentInfo.put("clientAmount", clientAmount);

        var saved = orderService.createOrder(request, paymentInfo, user.getLoginId());
        return new OrderResponse(saved);
    }

    @Override
    public void handleWebhook(String body) {
        // 필요 시 구현
    }
}
