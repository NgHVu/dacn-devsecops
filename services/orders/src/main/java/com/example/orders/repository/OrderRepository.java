package com.example.orders.repository;

import com.example.orders.entity.Order;
import com.example.orders.entity.OrderStatus; 
import org.springframework.data.domain.Page; 
import org.springframework.data.domain.Pageable; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; 

/**
 * Repository interface để tương tác với bảng 'orders' trong cơ sở dữ liệu. 💾
 * Kế thừa JpaRepository để có sẵn các phương thức CRUD cơ bản.
 */
@Repository 
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Tìm kiếm tất cả đơn hàng theo ID của người dùng.
     * Cân nhắc thêm Pageable để phân trang nếu danh sách có thể rất lớn.
     * @param userId ID của người dùng.
     * @return Danh sách các đơn hàng của người dùng đó (có thể cần sắp xếp theo ngày tạo).
     * @see #findByUserId(Long, Pageable)
     */
    List<Order> findByUserId(Long userId);

    /**
     * Tìm kiếm đơn hàng theo ID của người dùng, có hỗ trợ phân trang và sắp xếp.
     * @param userId ID của người dùng.
     * @param pageable Đối tượng chứa thông tin phân trang và sắp xếp (ví dụ: sắp xếp theo createdAt giảm dần).
     * @return Một trang (Page) chứa danh sách đơn hàng của người dùng.
     */
    Page<Order> findByUserId(Long userId, Pageable pageable); // Gợi ý: Thêm phương thức hỗ trợ phân trang

    /**
     * Tìm kiếm đơn hàng theo ID của người dùng và trạng thái đơn hàng.
     * @param userId ID của người dùng.
     * @param status Trạng thái đơn hàng cần tìm.
     * @return Danh sách các đơn hàng của người dùng với trạng thái tương ứng.
     */
    List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);

    /**
     * Tìm kiếm đơn hàng theo ID và ID của người dùng.
     * Rất quan trọng để đảm bảo người dùng chỉ truy cập đơn hàng của chính mình.
     * @param id ID của đơn hàng.
     * @param userId ID của người dùng sở hữu đơn hàng.
     * @return Optional chứa đơn hàng nếu tìm thấy và khớp userId, ngược lại là Optional rỗng.
     */
    Optional<Order> findByIdAndUserId(Long id, Long userId);

}
