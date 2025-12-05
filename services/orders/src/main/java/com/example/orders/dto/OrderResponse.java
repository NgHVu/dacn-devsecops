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

        // ----- Trạng thái & tổng tiền -----
        @Schema(description = "Trạng thái hiện tại của đơn hàng", example = "PENDING")
        String status,

        @Schema(description = "Tổng số tiền của đơn hàng", example = "25.50")
        BigDecimal totalAmount,

        // ----- Thông tin nhận hàng -----
        @Schema(description = "Tên người nhận hàng", example = "Nguyễn Văn A")
        String customerName,

        @Schema(description = "Địa chỉ giao hàng", example = "123 Đường ABC, Quận 1, TP.HCM")
        String shippingAddress,

        @Schema(description = "Số điện thoại liên lạc", example = "0901234567")
        String phoneNumber,

        @Schema(description = "Ghi chú chung cho đơn hàng", example = "Giao giờ hành chính")
        String note,

        // ----- Thanh toán -----
        @Schema(description = "Phương thức thanh toán (COD, VNPAY, BANKING)", example = "COD")
        String paymentMethod,

        @Schema(description = "Trạng thái thanh toán (PAID, UNPAID...)", example = "UNPAID")
        String paymentStatus,

        // ----- Danh sách món -----
        @Schema(description = "Danh sách chi tiết các món hàng trong đơn hàng")
        List<OrderItemResponse> items,

        // ----- Thời gian -----
        @Schema(description = "Thời điểm đơn hàng được tạo (có múi giờ)", example = "2025-10-28T14:30:00Z")
        OffsetDateTime createdAt,

        @Schema(description = "Thời điểm đơn hàng được cập nhật lần cuối (có múi giờ)", example = "2025-10-28T14:31:00Z")
        OffsetDateTime updatedAt
) {
}
