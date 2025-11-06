package kr.co.fittly.dto.user;

public class SignupResponse {
    private Long userId;
    private String loginId;
    private String email;
    private boolean emailVerified;

    public SignupResponse() {} // 기본 생성자

    public SignupResponse(Long userId, String loginId, String email, boolean emailVerified) {
        this.userId = userId;
        this.loginId = loginId;
        this.email = email;
        this.emailVerified = emailVerified;
    }

    public Long getUserId() { return userId; }
    public String getLoginId() { return loginId; }
    public String getEmail() { return email; }
    public boolean isEmailVerified() { return emailVerified; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setLoginId(String loginId) { this.loginId = loginId; }
    public void setEmail(String email) { this.email = email; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
}
