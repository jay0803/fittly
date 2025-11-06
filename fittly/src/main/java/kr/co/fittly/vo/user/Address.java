// src/main/java/kr/co/fittly/vo/user/Address.java
package kr.co.fittly.vo.user;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "addresses")
public class Address {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 30)  private String label;
    @Column(length = 30)  private String receiver;
    @Column(length = 20)  private String phone;
    @Column(length = 10)  private String zipcode;
    @Column(length = 255) private String address1;
    @Column(length = 255) private String address2;

    @Column(nullable = false)
    private boolean isDefault;   // ⚠ 필드명은 isDefault (예약어 피하기)
}
