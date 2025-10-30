package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO (Data Transfer Object) đại diện cho thông tin chi tiết của một đơn hàng
 * được trả về cho client sau khi tạo hoặc truy vấn. 
 * Sử dụng record của Java để đảm bảo tính bất biến (immutable).
 *
 * @param id          ID duy nhất của đơn hàng.
 * @param userId      ID của người dùng đã đặt đơn hàng này.
 * @param status      Trạng thái hiện tại của đơn hàng (vd: "PENDING", "PROCESSING", "DELIVERED").
 * @param totalAmount Tổng số tiền cuối cùng của đơn hàng.
 * @param items       Danh sách các món hàng chi tiết có trong đơn hàng.
 * @param createdAt   Thời gian đơn hàng được tạo trong hệ thống.
 * @param updatedAt   Thời gian thông tin đơn hàng được cập nhật lần cuối.
 */
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

        @Schema(description = "Thời điểm đơn hàng được tạo", example = "2025-10-28T14:30:00")
        LocalDateTime createdAt,

        @Schema(description = "Thời điểm đơn hàng được cập nhật lần cuối", example = "2025-10-28T14:31:00")
        LocalDateTime updatedAt
) {
}
