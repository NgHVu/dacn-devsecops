package com.example.users.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Custom exception để báo hiệu rằng một email đã được đăng ký.
 * Annotation @ResponseStatus(HttpStatus.CONFLICT) sẽ tự động làm cho Spring Boot
 * trả về mã lỗi 409 CONFLICT khi exception này được ném ra từ Controller.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
