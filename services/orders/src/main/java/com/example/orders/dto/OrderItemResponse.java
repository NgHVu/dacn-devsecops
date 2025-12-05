package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Thông tin chi tiết của một món hàng trong đơn hàng trả về")
public record OrderItemResponse(

        @Schema(description = "ID duy nhất của mục hàng", example = "10")
        Long id,

        @Schema(description = "ID của sản phẩm", example = "101")
        Long productId,

        @Schema(description = "Tên sản phẩm tại thời điểm đặt hàng", example = "Bánh mì kẹp thịt")
        String productName,

        @Schema(description = "Số lượng sản phẩm", example = "2")
        Integer quantity,

        @Schema(description = "Giá của một đơn vị sản phẩm tại thời điểm đặt hàng", example = "12.75")
        BigDecimal price
) {
}