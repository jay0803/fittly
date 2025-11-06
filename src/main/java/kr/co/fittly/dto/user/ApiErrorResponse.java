package kr.co.fittly.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApiErrorResponse {
    private final boolean success; // 항상 false
    private final String message;
}