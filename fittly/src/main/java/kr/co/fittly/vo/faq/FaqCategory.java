package kr.co.fittly.vo.faq;

import lombok.Getter;

@Getter
public enum FaqCategory {
    MEMBER("회원"),
    ORDER("주문/배송"),
    PAYMENT("결제"),
    PRODUCT("상품"),
    ETC("기타");

    private final String displayName;

    FaqCategory(String displayName) {
        this.displayName = displayName;
    }
}
