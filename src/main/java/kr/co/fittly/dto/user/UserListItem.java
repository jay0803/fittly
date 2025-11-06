package kr.co.fittly.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserListItem {
    private Long id;
    private String name;
    private String loginId;
    private String email;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
}