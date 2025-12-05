package com.example.products.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @Column(nullable = false, length = 120, unique = true)
    @Schema(description = "Tên món ăn", example = "Cơm Tấm Sườn Bì Chả")
    private String name;

    @Column(columnDefinition = "TEXT")
    @Schema(description = "Mô tả chi tiết món ăn", example = "Sườn nướng mật ong thơm ngon...")
    private String description;

    @NotNull(message = "Giá không được null")
    @DecimalMin(value = "0.01")
    @Digits(integer = 10, fraction = 2)
    @Column(nullable = false, precision = 12, scale = 2)
    @Schema(description = "Giá bán (VND)", example = "55000.00")
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Size(max = 255)
    @Schema(description = "Tên file ảnh hoặc URL", example = "com-tam.jpg")
    private String image;

    // --- NEW FIELDS FOR RATING & ANALYTICS ---

    @Column(name = "average_rating")
    @Builder.Default
    @Schema(description = "Điểm đánh giá trung bình (1.0 - 5.0)", example = "4.5")
    private Double averageRating = 0.0;

    @Column(name = "review_count")
    @Builder.Default
    @Schema(description = "Tổng số lượt đánh giá", example = "150")
    private Integer reviewCount = 0;

    @Column(name = "sold")
    @Builder.Default
    @Schema(description = "Số lượng đã bán (dùng cho Best Seller)", example = "1200")
    private Integer sold = 0;

    // -----------------------------------------

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnoreProperties("products")
    private Category category;
}