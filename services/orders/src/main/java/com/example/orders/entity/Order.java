package com.example.orders.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
@Entity 
@Table(name = "orders") // Ánh xạ vào bảng "orders" trong CSDL
@EntityListeners(AuditingEntityListener.class) // Kích hoạt tính năng tự động điền timestamp
@EqualsAndHashCode(exclude = "items")
public class Order {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    /**
     * ID của người dùng đã đặt hàng này.
     * Thông tin chi tiết người dùng sẽ được lấy từ Users Service.
     */
    @Column(name = "user_id", nullable = false) 
    private Long userId;

    // Trạng thái hiện tại của đơn hàng. 
    @Enumerated(EnumType.STRING) // Lưu trữ Enum dưới dạng String trong CSDL
    @Column(name = "status", nullable = false, length = 50) 
    private OrderStatus status; // Trạng thái đơn hàng

    // Tổng giá trị tiền tệ của đơn hàng.
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2) 
    private BigDecimal totalAmount; // Tổng tiền của đơn hàng

    // Quan hệ Một-Nhiều với OrderItem

    // Danh sách các mục hàng (sản phẩm và số lượng) trong đơn hàng này.
    @OneToMany(
            mappedBy = "order",              // Thuộc tính trong OrderItem trỏ về Order
            cascade = CascadeType.ALL,       // Thao tác với Order sẽ ảnh hưởng OrderItem (lưu, xóa)
            orphanRemoval = true,            // Xóa OrderItem khỏi list sẽ xóa nó khỏi DB
            fetch = FetchType.LAZY             // Chỉ tải danh sách items khi thực sự cần
    )
    @Builder.Default // Đảm bảo list luôn được khởi tạo khi dùng Builder
    private List<OrderItem> items = new ArrayList<>();

    // Thời điểm đơn hàng được tạo.
    @CreatedDate // Tự động điền thời gian tạo
    @Column(name = "created_at", nullable = false, updatable = false) 
    private LocalDateTime createdAt;

    // Thời điểm đơn hàng được cập nhật lần cuối.
    @LastModifiedDate // Tự động điền thời gian cập nhật cuối cùng
    @Column(name = "updated_at", nullable = false) 
    private LocalDateTime updatedAt;


    /**
     * Thêm một mục hàng vào đơn hàng này, đồng thời thiết lập quan hệ hai chiều.
     * @param item Mục hàng cần thêm.
     */
    public void addItem(OrderItem item) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        if (!this.items.contains(item)) { // Tránh thêm trùng lặp 
            this.items.add(item);
            item.setOrder(this); // Thiết lập liên kết ngược từ OrderItem về Order
        }
    }

    /**
     * Xóa một mục hàng khỏi đơn hàng này, đồng thời hủy quan hệ hai chiều.
     * @param item Mục hàng cần xóa.
     */
    public void removeItem(OrderItem item) {
        if (this.items != null && this.items.remove(item)) {
             item.setOrder(null); // Hủy liên kết ngược
        }
    }

    // Ghi đè toString() để tránh lỗi LazyInitializationException nếu log đối tượng Order
    // Chỉ bao gồm các trường cơ bản, không bao gồm collection 'items'
    @Override
    public String toString() {
        return "Order{" +
                "id=" + id +
                ", userId=" + userId +
                ", status=" + status +
                ", totalAmount=" + totalAmount +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
