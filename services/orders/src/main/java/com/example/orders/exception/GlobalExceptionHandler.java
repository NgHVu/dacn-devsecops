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
 * Lớp xử lý exception tập trung cho toàn bộ ứng dụng (Centralized Exception Handling).  centralised exception handling 
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
        errorBody.put("timestamp", LocalDateTime.now()); // Thời gian xảy ra lỗi
        errorBody.put("status", status.value());         // Mã HTTP status (vd: 404)
        errorBody.put("error", status.getReasonPhrase()); // Tên HTTP status (vd: "Not Found")
        errorBody.put("message", message);                // Thông điệp lỗi cụ thể
        errorBody.put("path", path);                      // URI của request gây lỗi
        return errorBody;
    }

    /**
     * Xử lý lỗi OrderNotFoundException (404 Not Found).
     * Được kích hoạt khi service ném ra OrderNotFoundException.
     */
    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Object> handleOrderNotFoundException(
            OrderNotFoundException ex, WebRequest request) {
        log.warn("Không tìm thấy đơn hàng: {}", ex.getMessage()); // Log ở mức WARN vì đây là lỗi client/request
        // Lấy URI một cách an toàn hơn
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        Map<String, Object> body = createErrorBody(HttpStatus.NOT_FOUND, ex.getMessage(), path);
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    /**
     * Xử lý lỗi IllegalArgumentException (400 Bad Request).
     * Thường dùng cho các lỗi đầu vào không hợp lệ chung chung mà không phải lỗi validation cụ thể.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        log.warn("Tham số không hợp lệ: {}", ex.getMessage());
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        Map<String, Object> body = createErrorBody(HttpStatus.BAD_REQUEST, ex.getMessage(), path);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Xử lý lỗi validation từ @Valid (400 Bad Request).
     * Được kích hoạt khi dữ liệu trong @RequestBody hoặc @RequestParam không qua được các ràng buộc validation.
     * Trả về thông tin chi tiết về các trường bị lỗi.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        log.warn("Lỗi validation: {}", ex.getMessage()); 
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();

        // Lấy chi tiết lỗi của từng trường (field) bị sai
        // Ví dụ: {"quantity": "must be greater than or equal to 1", "productId": "must not be null"}
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .filter(error -> error.getDefaultMessage() != null) // Đảm bảo message không null
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));

        Map<String, Object> body = createErrorBody(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ.", path);
        body.put("details", fieldErrors); // Thêm chi tiết lỗi field vào response body
        log.warn("Chi tiết lỗi validation: {}", fieldErrors); // Log cả chi tiết lỗi
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Xử lý lỗi BadCredentialsException từ Spring Security (401 Unauthorized).
     * Thường xảy ra khi:
     * - Gọi User Service để lấy thông tin user thất bại (không tìm thấy, token sai).
     * - Logic xác thực tùy chỉnh khác ném ra lỗi này.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Object> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        log.warn("Lỗi xác thực hoặc ủy quyền: {}", ex.getMessage());
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        Map<String, Object> body = createErrorBody(HttpStatus.UNAUTHORIZED, ex.getMessage(), path);
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }


    /**
     * Xử lý tất cả các lỗi không mong muốn khác (500 Internal Server Error).
     * Đây là handler "bắt cuối cùng" (catch-all) cho mọi Exception chưa được xử lý cụ thể ở trên.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("Lỗi server không mong muốn tại đường dẫn '{}':",
                  ((ServletWebRequest)request).getRequest().getRequestURI(), ex);
        String path = ((ServletWebRequest)request).getRequest().getRequestURI();
        // Trả về một message chung chung cho client để tránh lộ chi tiết lỗi server
        Map<String, Object> body = createErrorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống không mong muốn. Vui lòng thử lại sau.", path);
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
