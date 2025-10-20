package com.example.products.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// Đổi tên thành số ít để đồng bộ với Entity "Product"
@Schema(description = "Payload để tạo mới một sản phẩm")
public record ProductCreateRequest(

        @NotBlank(message = "Tên không được để trống")
        @Size(min = 1, max = 120, message = "Tên phải từ 1 đến 120 ký tự")
        @Schema(description = "Tên sản phẩm", example = "Cơm Tấm Sườn Bì Chả")
        String name,

        @NotNull(message = "Giá không được null")
        @DecimalMin(value = "0.01", message = "Giá phải lớn hơn hoặc bằng 0.01")
        @Digits(integer = 10, fraction = 2, message = "Giá không hợp lệ")
        @Schema(description = "Giá bán (VND)", example = "55000.00")
        BigDecimal price,

        // Nếu ảnh là bắt buộc, thêm @NotBlank
        @NotBlank(message = "Ảnh không được để trống") 
        @Size(max = 255, message = "Độ dài URL ảnh tối đa 255 ký tự")
        @Schema(description = "Tên file ảnh hoặc URL", example = "com-tam.jpg")
        String image
) {}