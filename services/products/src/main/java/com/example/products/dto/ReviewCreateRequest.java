package com.example.products.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewCreateRequest(
    @NotNull(message = "Product ID không được để trống")
    Long productId,

    @NotNull(message = "Order ID không được để trống")
    Long orderId,

    @NotNull(message = "Rating không được để trống")
    @Min(value = 1, message = "Đánh giá thấp nhất là 1 sao")
    @Max(value = 5, message = "Đánh giá cao nhất là 5 sao")
    Integer rating,

    @Size(max = 500, message = "Bình luận không quá 500 ký tự")
    String comment,
    
    // Tên người dùng được gửi từ Client (hoặc lấy từ Token ở Gateway)
    // Để lưu cache vào bảng Review, tránh gọi sang Users Service
    String userName 
) {}