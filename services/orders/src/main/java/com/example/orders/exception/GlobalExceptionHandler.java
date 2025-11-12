package com.example.orders.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lớp xử lý exception tập trung cho toàn bộ ứng dụng (Centralized Exception Handling).
 * Sử dụng {@code @RestControllerAdvice} để bắt các exception được ném ra
 * từ các {@code @RestController} và trả về response lỗi dạng JSON chuẩn hóa.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Tạo cấu trúc body chuẩn cho response lỗi.
     * @param status HttpStatus (ví dụ: NOT_FOUND, BAD_REQUEST).
     * @param message Thông điệp lỗi chính.
     * @param path Đường dẫn URI nơi xảy ra lỗi.
     * @return Một Map chứa thông tin lỗi chuẩn hóa.
     */
    private Map<String, Object> createErrorBody(HttpStatus status, String message, String path) {
        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("timestamp", LocalDateTime.now());
        errorBody.put("status", status.value());
        errorBody.put("error", status.getReasonPhrase());
        errorBody.put("message", message);
        errorBody.put("path", path);
        return errorBody;
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Object> handleOrderNotFoundException(
            OrderNotFoundException ex, WebRequest request) {
        log.warn("Không tìm thấy đơn hàng: {}", ex.getMessage());
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        Map<String, Object> body = createErrorBody(HttpStatus.NOT_FOUND, ex.getMessage(), path);
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        log.warn("Tham số không hợp lệ: {}", ex.getMessage());
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        Map<String, Object> body = createErrorBody(HttpStatus.BAD_REQUEST, ex.getMessage(), path);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        log.warn("Lỗi validation: {}", ex.getMessage());
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();

        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .filter(error -> error.getDefaultMessage() != null)
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));

        Map<String, Object> body = createErrorBody(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ.", path);
        body.put("details", fieldErrors);
        log.warn("Chi tiết lỗi validation: {}", fieldErrors);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Object> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        log.warn("Lỗi xác thực hoặc ủy quyền: {}", ex.getMessage());
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        Map<String, Object> body = createErrorBody(HttpStatus.UNAUTHORIZED, ex.getMessage(), path);
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("Lỗi server không mong muốn tại đường dẫn '{}':",
                ((ServletWebRequest)request).getRequest().getRequestURI(), ex);
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        Map<String, Object> body = createErrorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống không mong muốn. Vui lòng thử lại sau.", path);
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}