// src/main/java/kr/co/fittly/dto/SignupRequest.java
package kr.co.fittly.dto.user;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class SignupRequest {

    @NotBlank
    private String loginId;

    @NotBlank @Email
    private String email;

    @NotBlank
    private String password;

    // 이름
    @JsonAlias({"fullName"})
    private String name;

    // 전화번호: phoneNumber, tel, mobile 도 허용
    @JsonAlias({"phoneNumber","tel","mobile"})
    private String phone;

    // 우편번호: zipCode, postcode, postCode, zip 도 허용
    @JsonAlias({"zipCode","postcode","postCode","zip"})
    private String zipcode;

    // 주소1: addr1, addressLine1, roadAddress, address 도 허용
    @JsonAlias({"addr1","addressLine1","roadAddress","address"})
    private String address1;

    // 주소2: addr2, addressLine2, detailAddress, addressDetail 도 허용
    @JsonAlias({"addr2","addressLine2","detailAddress","addressDetail"})
    private String address2;

    private List<String> fashionStyles;
    private List<String> preferredCategories;
    private Integer heightCm;
    private Integer weightKg;
    private String bodyType;
    private String hairstyle;
    private String hairstylePreset;
}
