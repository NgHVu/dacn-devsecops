package com.example.orders.dto;

import com.example.orders.dto.OrderItemRequest; 
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid; 
import jakarta.validation.constraints.NotEmpty; 
import jakarta.validation.constraints.NotNull; 

import java.util.List;

/**
 * DTO (Data Transfer Object) chứa dữ liệu đầu vào khi client yêu cầu tạo đơn hàng mới. 📝
 * Sử dụng record của Java để đảm bảo tính bất biến (immutable).
 *
 * @param items Danh sách các món hàng (sản phẩm và số lượng) mà người dùng muốn đặt.
 * Phải chứa ít nhất một món hàng.
 */
@Schema(description = "Payload chứa thông tin chi tiết để tạo một đơn hàng mới.")
public record OrderCreateRequest(

        @Schema(description = "Danh sách chi tiết các món hàng và số lượng.",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Danh sách món hàng không được để trống.")
        @NotEmpty(message = "Đơn hàng phải có ít nhất một món hàng.") 
        @Valid // Kích hoạt validation cho từng OrderItemRequest trong list
        List<OrderItemRequest> items
) {
    // Records tự động tạo constructor, getters, equals, hashCode, toString.
}
