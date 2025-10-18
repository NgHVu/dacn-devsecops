package com.example.products;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Payload tạo mới sản phẩm")
public record ProductsCreateRequest(

        @NotBlank(message = "Tên không được để trống")
        @Size(min = 1, max = 120, message = "Tên phải từ 1 đến 120 ký tự")
        @Schema(description = "Tên sản phẩm", example = "Cơm Tấm Sườn Bì Chả")
        String name,

        @NotNull(message = "Giá không được null")
        @DecimalMin(value = "0.01", message = "Giá phải lớn hơn hoặc bằng 0.01")
        @Digits(integer = 10, fraction = 2, message = "Giá không hợp lệ (tối đa 10 số nguyên và 2 số thập phân)")
        @Schema(description = "Giá bán (VND)", example = "55000.00")
        BigDecimal price,

        @Size(max = 255, message = "Độ dài ảnh tối đa 255 ký tự")
        @Schema(description = "Tên file ảnh hoặc URL", example = "com-tam.jpg")
        String image
) {}
