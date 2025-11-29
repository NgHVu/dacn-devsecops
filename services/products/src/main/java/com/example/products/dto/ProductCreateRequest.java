package com.example.products.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Schema(description = "Payload để tạo mới một sản phẩm")
public record ProductCreateRequest(

        @NotBlank(message = "Tên không được để trống")
        @Size(min = 1, max = 120, message = "Tên phải từ 1 đến 120 ký tự")
        @Schema(description = "Tên sản phẩm", example = "Cơm Tấm Sườn Bì Chả")
        String name,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        @Schema(description = "Mô tả chi tiết món ăn", example = "Sườn nướng mật ong thơm ngon...")
        String description,

        @NotNull(message = "Giá không được null")
        @DecimalMin(value = "0.01", message = "Giá phải lớn hơn hoặc bằng 0.01")
        @Digits(integer = 10, fraction = 2, message = "Giá không hợp lệ")
        @Schema(description = "Giá bán (VND)", example = "55000.00")
        BigDecimal price,

        @NotNull(message = "Số lượng tồn kho không được để trống")
        @Min(value = 0, message = "Số lượng tồn kho không thể âm")
        @Schema(description = "Số lượng tồn kho ban đầu", example = "100")
        Integer stockQuantity,

        //@NotBlank(message = "Ảnh không được để trống") 
        @Size(max = 255, message = "Độ dài URL ảnh tối đa 255 ký tự")
        @Schema(description = "Tên file ảnh hoặc URL", example = "com-tam.jpg")
        String image,

        @NotNull(message = "Danh mục không được để trống")
        @Schema(description = "ID của danh mục sản phẩm", example = "1")
        Long categoryId
) {}