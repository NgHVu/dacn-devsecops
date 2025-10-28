package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/**
 * DTO đại diện cho thông tin chi tiết của một món hàng trong một {@link OrderResponse}. 
 * Sử dụng record của Java để đảm bảo tính bất biến.
 *
 * @param id        ID duy nhất của mục hàng trong đơn hàng.
 * @param productId ID của sản phẩm tương ứng.
 * @param quantity  Số lượng sản phẩm cho mục hàng này.
 * @param price     Giá của một đơn vị sản phẩm tại thời điểm đặt hàng.
 */
@Schema(description = "Thông tin chi tiết của một món hàng trong đơn hàng trả về")
public record OrderItemResponse(

        @Schema(description = "ID duy nhất của mục hàng", example = "10")
        Long id,

        @Schema(description = "ID của sản phẩm", example = "101")
        Long productId,

        @Schema(description = "Số lượng sản phẩm", example = "2")
        Integer quantity,

        @Schema(description = "Giá của một đơn vị sản phẩm tại thời điểm đặt hàng", example = "12.75")
        BigDecimal price
) {
}