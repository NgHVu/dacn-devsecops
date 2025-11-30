package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Chi tiết của một món hàng trong yêu cầu đặt hàng")
public record OrderItemRequest(

        @Schema(description = "ID của sản phẩm", requiredMode = Schema.RequiredMode.REQUIRED, example = "101")
        @NotNull(message = "ID sản phẩm không được để trống.")
        Long productId,

        @Schema(description = "Số lượng sản phẩm", requiredMode = Schema.RequiredMode.REQUIRED, example = "2", minimum = "1")
        @NotNull(message = "Số lượng không được để trống.")
        @Min(value = 1, message = "Số lượng phải ít nhất là 1.")
        Integer quantity,

        @Schema(description = "Ghi chú cho món ăn (Ví dụ: Không hành, size L...)", example = "Ít đá")
        String note
) {
}