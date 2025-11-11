package com.example.users.exception; // (Đảm bảo package khớp với của bạn)

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

/**
 * @ControllerAdvice này sẽ bắt (catch) các exception cụ thể
 * từ TẤT CẢ các Controller.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Hàm này được chỉ định để bắt EmailAlreadyExistsException.
     * Nó sẽ "thắng" cái @ResponseStatus và cả SecurityConfig.
     */
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Object> handleEmailAlreadyExists(
        EmailAlreadyExistsException ex, 
        WebRequest request
    ) {
        // Bạn có thể tạo một DTO ErrorResponse đẹp hơn,
        // nhưng hiện tại chỉ cần trả về message lỗi là đủ.
        String errorMessage = ex.getMessage();

        // Trả về chính xác HttpStatus.CONFLICT (409)
        return new ResponseEntity<>(errorMessage, HttpStatus.CONFLICT);
    }

    // (Bạn cũng có thể thêm các handler khác ở đây)
    // Ví dụ:
    // @ExceptionHandler(UsernameNotFoundException.class)
    // public ResponseEntity<Object> handleUserNotFound( ... ) { ... }
}