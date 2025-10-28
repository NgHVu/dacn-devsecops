package com.example.orders.service;

import com.example.orders.dto.request.OrderCreateRequest;
import com.example.orders.dto.response.OrderResponse;
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
     * Logic bao gồm: xác thực người dùng, kiểm tra sản phẩm, tính toán tổng tiền,
     * và lưu đơn hàng vào cơ sở dữ liệu.
     *
     * @param orderRequest DTO chứa thông tin đơn hàng cần tạo.
     * @param bearerToken  JWT token của người dùng để xác thực và gọi service khác.
     * @return Thông tin chi tiết của đơn hàng vừa được tạo.
     */
    OrderResponse createOrder(OrderCreateRequest orderRequest, String bearerToken);

    /**
     * Lấy danh sách đơn hàng của một người dùng cụ thể, hỗ trợ phân trang.
     *
     * @param userId   ID của người dùng cần xem lịch sử.
     * @param pageable Thông tin phân trang và sắp xếp.
     * @return Một trang (Page) chứa danh sách các OrderResponse.
     */
    Page<OrderResponse> getOrdersByUserId(Long userId, Pageable pageable);

    /**
     * Lấy thông tin chi tiết của một đơn hàng cụ thể,
     * đồng thời kiểm tra quyền sở hữu của người dùng.
     *
     * @param orderId ID của đơn hàng cần xem.
     * @param userId  ID của người dùng đang đăng nhập (để kiểm tra).
     * @return Thông tin chi tiết của đơn hàng.
     * @throws OrderNotFoundException Nếu không tìm thấy đơn hàng hoặc không đúng chủ sở hữu.
     */
    OrderResponse getOrderByIdAndUserId(Long orderId, Long userId);

    // Bổ sung các phương thức khác sau này(ví dụ: hủy đơn, cập nhật trạng thái).
    // - cancelOrder(Long orderId, Long userId)
    // - updateOrderStatus(Long orderId, OrderStatus newStatus) // (Thường cho Admin)
}

