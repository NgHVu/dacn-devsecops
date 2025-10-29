package com.example.orders.exception; 

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception được ném ra khi không tìm thấy một đơn hàng cụ thể. 
 * Kế thừa từ {@link RuntimeException} nên là một unchecked exception.
 * Annotation {@code @ResponseStatus(HttpStatus.NOT_FOUND)} cung cấp mapping mặc định
 * sang mã trạng thái HTTP 404 nếu exception này không được xử lý cụ thể
 * bởi một {@code @ExceptionHandler}.
 */
@ResponseStatus(HttpStatus.NOT_FOUND) // Mặc định trả về lỗi 404 Not Found
public class OrderNotFoundException extends RuntimeException {

    // Thêm serialVersionUID cho chuẩn, dù không bắt buộc
    private static final long serialVersionUID = 1L;

    /**
     * Constructor với thông điệp lỗi mô tả chi tiết.
     * @param message Thông điệp mô tả tại sao không tìm thấy đơn hàng.
     */
    public OrderNotFoundException(String message) {
        super(message); // Gọi constructor của lớp cha (RuntimeException)
    }

    /**
     * Constructor với thông điệp lỗi và nguyên nhân gốc (cause).
     * Hữu ích khi bạn muốn bọc (wrap) một exception khác.
     * @param message Thông điệp mô tả lỗi.
     * @param cause Exception gốc gây ra lỗi này.
     */
    public OrderNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
