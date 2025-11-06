package kr.co.fittly.service.order;

import com.fasterxml.jackson.databind.JsonNode;
import kr.co.fittly.dto.cartnwish.CartOptionKey;
import kr.co.fittly.dto.order.OrderResponse;
import kr.co.fittly.dto.order.OrderItemResponse;
import kr.co.fittly.dto.payment.PaymentCallbackRequest;
import kr.co.fittly.repository.order.OrderRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.repository.product.ProductVariantRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.service.cartnwish.CartService;
import kr.co.fittly.vo.order.Order;
import kr.co.fittly.vo.order.OrderItem;
import kr.co.fittly.vo.order.OrderStatus;
import kr.co.fittly.vo.payaddress.PayAddress;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.product.ProductVariant;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CartService cartService;

    // ───────────── 유틸 ─────────────
    private User userOr401(String loginId) {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."));
    }

    private int unitPrice(Product p) {
        Integer d = p.getDiscountPrice();
        if (d != null && d > 0) return d;
        Integer n = p.getPrice();
        return (n == null || n < 0) ? 0 : n;
    }

    private static String norm(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** 주문 생성 (결제 완료 후 호출) */
    @Transactional
    public Order createOrder(PaymentCallbackRequest request, JsonNode paymentInfo, String loginId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 없습니다.");
        }
        if (request.getProducts() == null || request.getProducts().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "주문 상품 목록이 비어 있습니다.");
        }

        User user = userOr401(loginId);

        PayAddress payAddress = PayAddress.builder()
                .receiverName(request.getReceiverName())
                .zipcode(request.getZipcode())
                .address1(request.getAddress1())
                .address2(request.getAddress2())
                .receiverPhone(request.getReceiverPhone())
                .build();

        Order order = Order.builder()
                .user(user)
                .orderUid(request.getMerchantUid())
                .impUid(request.getImpUid())
                .amount(0)
                .address(payAddress)
                .status(OrderStatus.PAID)
                .build();

        List<OrderItem> orderItems = request.getProducts().stream()
                .filter(Objects::nonNull)
                .map(p -> {
                    Product prod = productRepository.findById(p.getProductId())
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST, "상품을 찾을 수 없습니다: " + p.getProductId()
                            ));
                    int priceEach = unitPrice(prod);
                    int qty = Math.max(1, p.getQuantity());

                    ProductVariant variant = variantRepository
                            .findFirstByProductAndColorAndMaybeSize(
                                    prod,
                                    norm(p.getColor()),
                                    norm(p.getSize())
                            )
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST,
                                    "해당 옵션(" + p.getColorName() + "/" + p.getSize() + ")의 재고를 찾을 수 없습니다."
                            ));

                    int newStock = variant.getStock() - qty;
                    if (newStock < 0) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "재고가 부족합니다.");
                    }
                    variant.setStock(newStock);
                    variantRepository.save(variant);

                    Integer totalStock = variantRepository.findByProduct_Id(prod.getId())
                            .stream()
                            .map(ProductVariant::getStock)
                            .reduce(0, Integer::sum);
                    prod.setStock(totalStock);
                    productRepository.save(prod);

                    return OrderItem.builder()
                            .order(order)
                            .product(prod)
                            .orderPrice(priceEach)
                            .quantity(qty)
                            .color(norm(p.getColor()))
                            .colorName(norm(p.getColorName()))
                            .size(norm(p.getSize()))
                            .build();
                })
                .collect(Collectors.toList());

        order.getOrderItems().addAll(orderItems);

        int itemsSum = orderItems.stream()
                .mapToInt(oi -> Math.max(0, oi.getOrderPrice()) * Math.max(1, oi.getQuantity()))
                .sum();

        Integer verifiedAmount = (paymentInfo != null && paymentInfo.get("amount") != null)
                ? paymentInfo.get("amount").asInt()
                : null;
        int finalAmount = (verifiedAmount != null) ? verifiedAmount : itemsSum;

        order.setAmount(finalAmount);

        Order saved = orderRepository.save(order);

        // [CHANGED] 옵션 단위로 장바구니 삭제
        List<CartOptionKey> optionKeys = request.getProducts().stream()
                .filter(Objects::nonNull)
                .map(p -> CartOptionKey.builder()
                        .productId(p.getProductId())
                        .color(norm(p.getColor()))
                        .size(norm(p.getSize()))
                        .build())
                .collect(Collectors.toList());

        if (!optionKeys.isEmpty()) {
            cartService.removeItemsAfterOrderByOptions(loginId, optionKeys);
        }

        return saved;
    }

    /** 내 주문 목록 */
    @Transactional(readOnly = true)
    public List<OrderResponse> findMyOrders(String loginId) {
        User user = userOr401(loginId);
        List<Order> orders = orderRepository.findByUserWithDetails(user);
        return orders.stream().map(OrderResponse::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderItemResponse> findMyOrderItems(String loginId, String orderUid) {
        User user = userOr401(loginId);

        Order order = orderRepository.findByOrderUidAndUserFetch(orderUid, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found"));

        return order.getOrderItems().stream()
                .map(oi -> new OrderItemResponse(oi))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse findByOrderUid(String orderUid, String loginId) {
        User user = userOr401(loginId);

        Order order = orderRepository.findByOrderUidAndUserFetch(orderUid, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not_found"));

        return new OrderResponse(order);
    }
}
