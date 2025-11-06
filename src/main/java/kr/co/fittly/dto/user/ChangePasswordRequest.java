package kr.co.fittly.dto.user;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
// import jakarta.validation.constraints.Pattern; // ← 정책을 정규식으로 강제할 때 사용

public record ChangePasswordRequest(
        @NotBlank(message = "currentPassword is required")
        String currentPassword,

        @NotBlank(message = "newPassword is required")
        @Size(min = 8, max = 64, message = "newPassword must be 8~64 characters")
        // @Pattern(
        //     regexp = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,64}$",
        //     message = "newPassword must contain at least one uppercase letter and one special character"
        // )
        String newPassword
) {
    /** 앞뒤 공백 제거 등 간단한 정규화 */
    @JsonCreator
    public ChangePasswordRequest(
            @JsonProperty("currentPassword") String currentPassword,
            @JsonProperty("newPassword") String newPassword
    ) {
        this.currentPassword = currentPassword == null ? null : currentPassword.trim();
        this.newPassword = newPassword == null ? null : newPassword.trim();
    }
}
