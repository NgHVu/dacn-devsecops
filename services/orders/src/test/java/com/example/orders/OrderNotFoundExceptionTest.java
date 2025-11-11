package com.example.orders;

import com.example.orders.exception.OrderNotFoundException; 
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test đơn giản để tăng coverage cho OrderNotFoundException.
 * Test này đảm bảo cả 2 constructor đều được gọi.
 */
@DisplayName("OrderNotFoundException Tests")
class OrderNotFoundExceptionTest {

    @Test
    @DisplayName("Constructor 1 (message) hoạt động")
    void testConstructorWithMessage() {
        String message = "Không tìm thấy";
        OrderNotFoundException ex = new OrderNotFoundException(message);
        
        assertThat(ex.getMessage()).isEqualTo(message);
        assertThat(ex.getCause()).isNull();
    }

    @Test
    @DisplayName("Constructor 2 (message, cause) hoạt động")
    void testConstructorWithMessageAndCause() {
        String message = "Lỗi";
        Throwable cause = new RuntimeException("Lỗi gốc");
        OrderNotFoundException ex = new OrderNotFoundException(message, cause);
        
        assertThat(ex.getMessage()).isEqualTo(message);
        assertThat(ex.getCause()).isEqualTo(cause);
    }
}