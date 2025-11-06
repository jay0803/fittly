package kr.co.fittly.dto.user;

public class LoginRequest {
    private String loginId;
    private String password;

    public LoginRequest() {}
    public LoginRequest(String loginId, String password) {
        this.loginId = loginId;
        this.password = password;
    }
    public String getLoginId() { return loginId; }
    public String getPassword() { return password; }
    public void setLoginId(String loginId) { this.loginId = loginId; }
    public void setPassword(String password) { this.password = password; }
}
