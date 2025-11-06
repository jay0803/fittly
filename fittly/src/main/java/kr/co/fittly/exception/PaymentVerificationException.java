package kr.co.fittly.exception;

// public 클래스로 독립시켜 다른 곳에서도 참조할 수 있도록 합니다.
public class PaymentVerificationException extends RuntimeException {
    public PaymentVerificationException(String message) {
        super(message);
    }
}