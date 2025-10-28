package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min; // Dùng để kiểm tra giá trị tối thiểu
import jakarta.validation.constraints.NotNull; // Dùng để kiểm tra không bị null

/**
 * DTO đại diện cho một món hàng trong yêu cầu tạo đơn hàng {@link OrderCreateRequest}. 📦
 * Sử dụng record để đảm bảo không thay đổi được giá trị sau khi tạo.
 *
 * @param productId ID của sản phẩm được đặt. Không được null.
 * @param quantity Số lượng sản phẩm được đặt. Phải ít nhất là 1.
 */
@Schema(description = "Chi tiết của một món hàng trong yêu cầu đặt hàng")
public record OrderItemRequest(

        @Schema(description = "ID của sản phẩm", requiredMode = Schema.RequiredMode.REQUIRED, example = "101")
        @NotNull(message = "ID sản phẩm không được để trống.") // Bắt buộc phải có productId
        Long productId,

        @Schema(description = "Số lượng sản phẩm", requiredMode = Schema.RequiredMode.REQUIRED, example = "2", minimum = "1")
        @NotNull(message = "Số lượng không được để trống.") // Bắt buộc phải có số lượng
        @Min(value = 1, message = "Số lượng phải ít nhất là 1.") // Số lượng phải > 0
        Integer quantity
) {
}
