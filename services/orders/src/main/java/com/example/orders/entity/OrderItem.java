package com.example.orders.entity;

import jakarta.persistence.*; 
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Đại diện cho một mục hàng (một loại sản phẩm cụ thể với số lượng)
 * trong một đơn hàng {@link Order}.
 */
@Getter 
@Setter
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
@Entity 
@Table(name = "order_items") // Ánh xạ vào bảng "order_items"
@EntityListeners(AuditingEntityListener.class) // Kích hoạt Auditing
@EqualsAndHashCode(exclude = "order")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    // Quan hệ Nhiều-Một với Order

    // Đơn hàng chứa mục hàng này.
    @ManyToOne(fetch = FetchType.LAZY) // Chỉ tải Order khi cần
    @JoinColumn(name = "order_id", nullable = false) // Tên cột khóa ngoại, không được null
    private Order order; // Liên kết ngược về đơn hàng chứa mục này

    /**
     * ID của sản phẩm được đặt trong mục hàng này.
     * Thông tin chi tiết sản phẩm (tên, mô tả...) sẽ được lấy từ Products Service.
     */
    @Column(name = "product_id", nullable = false) 
    private Long productId;

    // Số lượng sản phẩm được đặt cho mục hàng này.
    @Column(nullable = false) 
    private Integer quantity;

    /**
     * Giá của một đơn vị sản phẩm tại thời điểm đơn hàng được tạo (snapshot price).
     * Giá này được lưu lại để đảm bảo tính chính xác ngay cả khi giá sản phẩm thay đổi sau này.
     */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // Thời điểm mục hàng được thêm vào đơn hàng.
    @CreatedDate // Tự động điền thời gian tạo
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm mục hàng được cập nhật lần cuối (ít dùng, nhưng hữu ích cho auditing).
    @LastModifiedDate // Tự động điền thời gian cập nhật
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Ghi đè toString() để tránh lỗi LazyInitializationException khi log
    @Override
    public String toString() {
        return "OrderItem{" +
                "id=" + id +
                ", orderId=" + (order != null ? order.getId() : null) + // Chỉ lấy ID của Order
                ", productId=" + productId +
                ", quantity=" + quantity +
                ", price=" + price +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
