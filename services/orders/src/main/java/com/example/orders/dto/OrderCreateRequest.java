package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * DTO chứa dữ liệu tạo đơn hàng mới.
 * [UPDATE] Thêm các trường thông tin giao hàng và thanh toán.
 */
@Schema(description = "Payload chứa thông tin chi tiết để tạo một đơn hàng mới.")
public record OrderCreateRequest(

        @Schema(description = "Tên người nhận hàng")
        @NotBlank(message = "Tên người nhận không được để trống")
        String customerName,

        @Schema(description = "Địa chỉ giao hàng")
        @NotBlank(message = "Địa chỉ không được để trống")
        String shippingAddress,

        @Schema(description = "Số điện thoại liên lạc")
        @NotBlank(message = "Số điện thoại không được để trống")
        String phoneNumber,

        @Schema(description = "Ghi chú đơn hàng")
        String note,

        @Schema(description = "Phương thức thanh toán (COD, VNPAY, BANKING)")
        String paymentMethod,

        @Schema(description = "Danh sách chi tiết các món hàng và số lượng.",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Danh sách món hàng không được để trống.")
        @NotEmpty(message = "Đơn hàng phải có ít nhất một món hàng.")
        @Valid
        List<OrderItemRequest> items
) {}