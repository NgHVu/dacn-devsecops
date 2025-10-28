package com.example.orders.repository;

import com.example.orders.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Đây là nơi để mình tương tác với bảng `order_items` trong database. 🛒
 * Giống như một "kho" chứa dữ liệu OrderItem vậy đó.
 * Mình kế thừa JpaRepository để Spring tự cung cấp các hàm cơ bản như
 * lưu (save), tìm kiếm (find), xóa (delete).
 */
@Repository // Đánh dấu đây là một Bean Repository, Spring sẽ quản lý nó.
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> { // <Kiểu Entity, Kiểu dữ liệu của ID>

    /**
     * Hàm này giúp tìm tất cả các món hàng (OrderItem) thuộc về một đơn hàng (Order) cụ thể.
     * Spring Data JPA sẽ tự động tạo câu lệnh SQL dựa trên tên hàm này. Magic! ✨
     * Nó sẽ tìm các OrderItem có trường 'order' và 'id' của order đó bằng với orderId mình đưa vào.
     *
     * @param orderId ID của đơn hàng mà mình muốn xem các món hàng bên trong.
     * @return Một danh sách (List) chứa tất cả các món hàng tìm được. Trả về list rỗng nếu không có món nào.
     */
    List<OrderItem> findByOrderId(Long orderId);

    // (Ghi chú cho tương lai)
    // Nếu sau này cần, có thể thêm các hàm tìm kiếm khác ở đây.
    // Ví dụ: tìm xem trong đơn hàng có sản phẩm nào đó không:
    // Optional<OrderItem> findByOrderIdAndProductId(Long orderId, Long productId);
    // Hoặc đếm số lượng món hàng trong đơn:
    // long countByOrderId(Long orderId);
}
