package com.example.orders.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/**
 * DTO đại diện cho dữ liệu sản phẩm nhận được từ Products Service
 * [FIX] Thêm ignoreUnknown = true để tránh lỗi 500 khi Product Service trả về các trường mới (rating, sold...)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(description = "Dữ liệu tóm tắt về sản phẩm nhận từ Product Service")
public record ProductDto(
        @Schema(description = "ID của sản phẩm")
        Long id,

        @Schema(description = "Tên sản phẩm")
        String name,

        @Schema(description = "Giá hiện tại của sản phẩm")
        BigDecimal price,

        @Schema(description = "Ảnh sản phẩm")
        String image,

        @Schema(description = "Số lượng tồn kho hiện tại")
        Integer stockQuantity
) {}