package com.example.orders.dto; 

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/**
 * DTO đại diện cho dữ liệu sản phẩm nhận được từ Products Service
 * Sử dụng record cho ngắn gọn. Các trường cần thiết tối thiểu là id và price
 *
 * @param id    ID của sản phẩm
 * @param name  Tên sản phẩm
 * @param price Giá hiện tại của sản phẩm
 * @param stockQuantity Số lượng tồn kho
 */
@Schema(description = "Dữ liệu tóm tắt về sản phẩm nhận từ Product Service")
public record ProductDto(
        @Schema(description = "ID của sản phẩm")
        Long id,

        @Schema(description = "Tên sản phẩm")
        String name, 

        @Schema(description = "Giá hiện tại của sản phẩm")
        BigDecimal price,

        @Schema(description = "Số lượng tồn kho hiện tại")
        Integer stockQuantity
) {}