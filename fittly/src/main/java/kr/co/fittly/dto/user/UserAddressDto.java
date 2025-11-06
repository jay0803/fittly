// src/main/java/kr/co/fittly/dto/user/AddressDto.java
package kr.co.fittly.dto.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserAddressDto {

    /** PK */
    private Long id;

    /** 프론트 입력: 수령인 (엔티티 receiver와 매핑) */
    private String name;

    /** 라벨(집, 회사 등) — 선택 */
    private String label;

    /** 백엔티티의 수령인 필드(백엔드 내부용/선택) */
    private String receiver;

    /** 연락처 */
    private String phone;

    /** 우편번호 */
    private String zipcode;

    /** 기본 주소 */
    private String address1;

    /** 상세 주소 */
    private String address2;

    /** 기본배송지 여부 */
    private Boolean isDefault;
}
