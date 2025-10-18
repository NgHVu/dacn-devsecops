package com.example.products; 

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

// --- Lombok Annotations ---
// Cung cấp getters, setters, constructors, v.v...
@Getter
@Setter
@NoArgsConstructor // Bắt buộc cho JPA
@AllArgsConstructor // Tiện lợi cho việc tạo đối tượng
@Builder
@EqualsAndHashCode(of = "id") // Chỉ so sánh dựa trên ID
@ToString
// --- JPA Annotation ---
@Entity // Đánh dấu đây là một đối tượng CSDL
@Table(name = "products", // Chỉ định tên bảng
       indexes = {
           // BỔ SUNG QUAN TRỌNG: Tạo index cho cột 'name' để tăng tốc độ tìm kiếm
           @Index(name = "idx_products_name", columnList = "name")
       })
@Schema(description = "Thông tin chi tiết của một sản phẩm")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Tự động tăng ID
    @Schema(description = "ID duy nhất của sản phẩm (tự sinh)", example = "1")
    private Long id;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(min = 1, max = 120, message = "Tên sản phẩm phải từ 1 đến 120 ký tự")
    @Column(nullable = false, length = 120)
    @Schema(description = "Tên món ăn", example = "Cơm Tấm Sườn Bì Chả")
    private String name;

    // TỐI ƯU QUAN TRỌNG: Sử dụng BigDecimal cho tiền tệ
    // Tránh tuyệt đối các lỗi làm tròn của float/double
    @NotNull(message = "Giá không được null")
    @DecimalMin(value = "0.01", message = "Giá phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Giá không hợp lệ")
    @Column(nullable = false, precision = 12, scale = 2)
    @Schema(description = "Giá bán (VND)", example = "55000.00")
    private BigDecimal price;

    @Size(max = 255, message = "Độ dài URL/tên file ảnh tối đa 255 ký tự")
    @Schema(description = "Tên file ảnh hoặc URL", example = "com-tam.jpg")
    private String image;

    // --- Cặp đôi Auditing (Ghi vết thời gian) chuyên nghiệp ---
    @CreationTimestamp // Tự động gán thời gian khi tạo
    @Column(name = "created_at", nullable = false, updatable = false)
    @Schema(description = "Thời điểm tạo (UTC)", example = "2025-10-18T17:40:00Z")
    private OffsetDateTime createdAt;

    @UpdateTimestamp // Tự động gán thời gian khi cập nhật
    @Column(name = "updated_at", nullable = false)
    @Schema(description = "Thời điểm cập nhật cuối (UTC)", example = "2025-10-18T17:40:00Z")
    private OffsetDateTime updatedAt;
}