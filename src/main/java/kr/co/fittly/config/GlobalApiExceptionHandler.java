package kr.co.fittly.config;

import jakarta.validation.ConstraintViolationException;
import kr.co.fittly.dto.user.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.stream.Collectors;

@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalApiExceptionHandler {

    @ExceptionHandler({
            ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            HttpMessageNotReadableException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ApiResponse<String>> handleBadRequest(Exception e) {
        log.warn("[400] Bad request: {}", e.getMessage());
        return status(HttpStatus.BAD_REQUEST, messageOr(e, "bad_request"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<String>> handleBind(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst().orElse("validation_failed");
        return ResponseEntity.badRequest().body(ApiResponse.fail(msg));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<String>> handleAuth(AuthenticationException e) {
        log.warn("[401] Authentication failed: {}", e.getMessage());
        return status(HttpStatus.UNAUTHORIZED, "unauthorized");
    }

    @ExceptionHandler({AccessDeniedException.class, SecurityException.class})
    public ResponseEntity<ApiResponse<String>> handleAccess(Exception e) {
        log.warn("[403] Access denied: {}", e.getMessage());
        return status(HttpStatus.FORBIDDEN, "forbidden");
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<String>> handleNoHandler(NoHandlerFoundException e) {
        log.warn("[404] No handler: {}", e.getRequestURL());
        return status(HttpStatus.NOT_FOUND, "not_found");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<String>> handleMethod(HttpRequestMethodNotSupportedException e) {
        log.warn("[405] Method not supported: {}", e.getMethod());
        return status(HttpStatus.METHOD_NOT_ALLOWED, "method_not_allowed");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<String>> handleConflict(DataIntegrityViolationException e) {
        log.warn("[409] Data conflict: {}", e.getMostSpecificCause().getMessage());
        return status(HttpStatus.CONFLICT, "conflict");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<String>> handleRse(ResponseStatusException e) {
        log.warn("[{}] ResponseStatusException: {}", e.getStatusCode(), e.getReason());
        return ResponseEntity.status(e.getStatusCode())
                .body(ApiResponse.fail(messageOr(e, "error")));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleAny(Exception e) {
        log.error("[500] Unexpected error", e);
        return status(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error");
    }

    private ResponseEntity<ApiResponse<String>> status(HttpStatus s, String msg) {
        return ResponseEntity.status(s).body(ApiResponse.fail(msg));
    }

    private String messageOr(Throwable t, String fallback) {
        String m = t.getMessage();
        return (m == null || m.isBlank()) ? fallback : m;
    }
}
