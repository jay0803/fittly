package kr.co.fittly.vo.payaddress;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PayAddress {
    private String receiverName;
    private String zipcode;
    private String address1;
    private String address2;
    private String receiverPhone;

    @Builder
    public PayAddress(String receiverName, String zipcode, String address1, String address2, String receiverPhone) {
        this.receiverName = receiverName;
        this.zipcode = zipcode;
        this.address1 = address1;
        this.address2 = address2;
        this.receiverPhone = receiverPhone;
    }
}