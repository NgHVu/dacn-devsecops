package com.example.products.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data // (Lombok) Tự động tạo Getters, Setters, toString, equals, hashCode
@NoArgsConstructor // (Lombok) Constructor rỗng cho JPA
@AllArgsConstructor // (Lombok) Constructor cho tất cả các trường
@Builder // (Lombok) Hỗ trợ Builder pattern
@Entity
@Table(name = "products",
       indexes = {
           @Index(name = "idx_products_name", columnList = "name")
       })
@Schema(description = "Thông tin chi tiết của một sản phẩm")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID duy nhất của sản phẩm (tự sinh)", example = "1")
    private Long id;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(min = 1, max = 120)
    // SỬA ĐỔI: Thêm unique = true để đảm bảo CSDL không trùng tên
    @Column(nullable = false, length = 120, unique = true) 
    @Schema(description = "Tên món ăn", example = "Cơm Tấm Sườn Bì Chả")
    private String name;

    @NotNull(message = "Giá không được null")
    @DecimalMin(value = "0.01")
    @Digits(integer = 10, fraction = 2)
    @Column(nullable = false, precision = 12, scale = 2)
    @Schema(description = "Giá bán (VND)", example = "55000.00")
    private BigDecimal price;

    @Size(max = 255)
    @Schema(description = "Tên file ảnh hoặc URL", example = "com-tam.jpg")
    private String image; // (Giữ nguyên tên `image` cho nhất quán)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}