// src/main/java/kr/co/fittly/dto/auth/SignupReq.java
package kr.co.fittly.dto.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true) // payload에 여분 필드가 있어도 무시
public record SignupReq(
        String loginId,
        String password,
        String name,
        String email,
        String phone,
        String zipcode,
        String address1,
        String address2,
        Boolean marketingAgreed
) {}
