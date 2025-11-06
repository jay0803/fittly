package kr.co.fittly.dto.user;

// final class로 만들어 상속을 막고, 생성자를 private으로 하여 정적 팩토리 메서드만 사용하도록 강제하면 더 안정적입니다.
public final class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;

    private ApiResponse() {} // 외부에서 new ApiResponse() 사용 금지

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = null;
        return response;
    }

    public static <T> ApiResponse<T> fail(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.data = null;
        response.message = message;
        return response;
    }

    // Getter들을 추가해주면 더 좋습니다.
    public boolean isSuccess() { return success; }
    public T getData() { return data; }
    public String getMessage() { return message; }
}