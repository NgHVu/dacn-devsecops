package com.example.orders.service;

import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderResponse;
import com.example.orders.exception.OrderNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Interface định nghĩa các nghiệp vụ chính liên quan đến quản lý đơn hàng. 
 * Implementation chi tiết sẽ nằm trong class OrderServiceImpl.
 */
public interface OrderService {

    /**
     * Tạo một đơn hàng mới.
     * Logic bao gồm: lấy userId từ email (gọi UserServiceClient), kiểm tra sản phẩm,
     * tính toán tổng tiền, và lưu đơn hàng vào cơ sở dữ liệu.
     *
     * @param orderRequest DTO chứa thông tin đơn hàng cần tạo.
     * @param bearerToken  JWT token của người dùng để xác thực và gọi service khác.
     * @return Thông tin chi tiết của đơn hàng vừa được tạo.
     */
    OrderResponse createOrder(OrderCreateRequest orderRequest, String bearerToken);

    /**
     * Lấy danh sách đơn hàng của một người dùng cụ thể (xác định bằng email), hỗ trợ phân trang.
     * Implementation sẽ cần gọi UserServiceClient để lấy userId từ email trước khi truy vấn DB.
     *
     * @param userEmail   Email của người dùng cần xem lịch sử (lấy từ Authentication).
     * @param bearerToken Token JWT để gọi UserServiceClient.
     * @param pageable    Thông tin phân trang và sắp xếp.
     * @return Một trang (Page) chứa danh sách các OrderResponse.
     */
    Page<OrderResponse> getOrders(String userEmail, String bearerToken, Pageable pageable); // ĐỔI TÊN VÀ THAM SỐ

    /**
     * Lấy thông tin chi tiết của một đơn hàng cụ thể,
     * đồng thời kiểm tra quyền sở hữu của người dùng (xác định bằng email).
     * Implementation sẽ cần gọi UserServiceClient để lấy userId từ email trước khi truy vấn DB.
     *
     * @param orderId     ID của đơn hàng cần xem.
     * @param userEmail   Email của người dùng đang đăng nhập (để kiểm tra).
     * @param bearerToken Token JWT để gọi UserServiceClient.
     * @return Thông tin chi tiết của đơn hàng.
     * @throws OrderNotFoundException Nếu không tìm thấy đơn hàng hoặc không đúng chủ sở hữu.
     */
    OrderResponse getOrderById(Long orderId, String userEmail, String bearerToken); // ĐỔI TÊN VÀ THAM SỐ

    // Bổ sung các phương thức khác sau này(ví dụ: hủy đơn, cập nhật trạng thái).
    // - cancelOrder(Long orderId, String userEmail, String bearerToken)
    // - updateOrderStatus(Long orderId, OrderStatus newStatus) // (Thường cho Admin)
}