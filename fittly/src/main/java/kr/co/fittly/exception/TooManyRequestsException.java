// src/main/java/kr/co/fittly/web/error/TooManyRequestsException.java
package kr.co.fittly.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) { super(message); }
}
