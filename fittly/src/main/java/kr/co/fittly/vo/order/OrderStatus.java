package kr.co.fittly.vo.order;

public enum OrderStatus {
    PAID,       // 결제 완료
    CANCELLED,  // 주문 취소
    PREPARING,  // 배송 준비중
    SHIPPING,   // 배송중
    DELIVERED   // 배송 완료
}