package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime; 
import java.util.List;

@Schema(description = "Thông tin chi tiết của một đơn hàng trả về cho client")
public record OrderResponse(

        @Schema(description = "ID duy nhất của đơn hàng", example = "1")
        Long id,

        @Schema(description = "ID của người dùng sở hữu đơn hàng", example = "42")
        Long userId,

        @Schema(description = "Trạng thái hiện tại của đơn hàng", example = "PENDING")
        String status, 

        @Schema(description = "Tổng số tiền của đơn hàng", example = "25.50")
        BigDecimal totalAmount,

        @Schema(description = "Danh sách chi tiết các món hàng trong đơn hàng")
        List<OrderItemResponse> items,

        @Schema(description = "Thời điểm đơn hàng được tạo (có múi giờ)", example = "2025-10-28T14:30:00Z")
        OffsetDateTime createdAt,

        @Schema(description = "Thời điểm đơn hàng được cập nhật lần cuối (có múi giờ)", example = "2025-10-28T14:31:00Z")
        OffsetDateTime updatedAt
) {
}