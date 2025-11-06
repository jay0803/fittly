package kr.co.fittly.dto.user;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeResponse {
    private Long id;
    private String loginId;
    private String email;
    private String name;
    private String phone;
    private LocalDateTime createdAt;
    private String zipcode;
    private String address1;
    private String address2;
    private Integer height;
    private Integer weight;

    // ✅ 컨트롤러에서 쓰는 9개짜리 편의 생성자
    public MeResponse(Long id, String loginId, String email, String name, String phone,
                      LocalDateTime createdAt, String zipcode, String address1, String address2) {
        this.id = id;
        this.loginId = loginId;
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.createdAt = createdAt;
        this.zipcode = zipcode;
        this.address1 = address1;
        this.address2 = address2;
        this.height = null;
        this.weight = null;
    }
}
