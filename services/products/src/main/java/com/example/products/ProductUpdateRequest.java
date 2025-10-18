package com.example.products;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Schema(description = "Payload cập nhật (trường nào gửi thì trường đó được cập nhật)")
public record ProductUpdateRequest(

        @Size(min = 1, max = 120, message = "Tên phải từ 1 đến 120 ký tự")
        @Schema(description = "Tên sản phẩm", example = "Cơm Tấm Sườn Bì Chả")
        String name, // nullable

        @DecimalMin(value = "0.01", message = "Giá phải lớn hơn hoặc bằng 0.01")
        @Digits(integer = 10, fraction = 2, message = "Giá không hợp lệ (tối đa 10 số nguyên và 2 số thập phân)")
        @Schema(description = "Giá bán (VND)", example = "55000.00")
        BigDecimal price, // nullable

        @Size(max = 255, message = "Độ dài ảnh tối đa 255 ký tự")
        @Schema(description = "Tên file ảnh hoặc URL", example = "com-tam.jpg")
        String image // nullable
) {}
