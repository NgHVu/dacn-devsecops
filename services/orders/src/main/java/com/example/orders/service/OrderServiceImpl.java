package com.example.orders.service;

import com.example.orders.dto.ProductDto;
import com.example.orders.dto.UserDto;
import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderItemRequest;
import com.example.orders.dto.OrderItemResponse;
import com.example.orders.dto.OrderResponse;

import com.example.orders.entity.Order;
import com.example.orders.entity.OrderItem;
import com.example.orders.entity.OrderStatus;
import com.example.orders.exception.OrderNotFoundException;
import com.example.orders.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementation (hiện thực) của {@link OrderService}.
 * Chứa logic nghiệp vụ chính, bao gồm cả việc gọi API
 * sang các service khác (Users, Products).
 */
@Service
@RequiredArgsConstructor 
@Slf4j 
@Transactional 
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserServiceClient userServiceClient;
    private final ProductServiceClient productServiceClient;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional 
    public OrderResponse createOrder(OrderCreateRequest orderRequest, String bearerToken) {
        log.info("Bắt đầu xử lý tạo đơn hàng mới...");

        // --- 1. Lấy thông tin người dùng từ User Service (dùng /me) ---
        // Lấy thông tin xác thực (đã được JwtAuthenticationFilter xử lý)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            log.warn("Không thể lấy thông tin xác thực từ Security Context.");
            throw new BadCredentialsException("Không có thông tin xác thực hợp lệ.");
        }
        String userEmail = authentication.getName(); // Email từ token
        log.info("Đã xác thực người dùng với email: {}", userEmail);

        // Gọi UserServiceClient (đã được cấu hình WebClient)
        // Service này sẽ gọi đến GET /api/users/me của User Service
        UserDto userDto = userServiceClient.getCurrentUser(bearerToken);
        if (userDto == null || userDto.id() == null) {
             throw new IllegalStateException("Không thể lấy được ID người dùng từ User Service.");
        }
        Long userId = userDto.id(); // Lấy userId thật
        log.info("Lấy được userId thật: {}", userId);

        // --- 2. Lấy thông tin sản phẩm từ Products Service ---
        Set<Long> productIds = orderRequest.items().stream()
                .map(OrderItemRequest::productId)
                .collect(Collectors.toSet());
        log.info("Danh sách productId cần kiểm tra: {}", productIds);

        if (productIds.isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải có ít nhất một sản phẩm.");
        }

        // Gọi ProductServiceClient (đã được cấu hình WebClient)
        List<ProductDto> productDtos = productServiceClient.getProductsByIds(productIds, bearerToken);

        // Client đã xử lý lỗi 4xx, 5xx. Ở đây ta kiểm tra logic nghiệp vụ.
        if (productDtos.size() != productIds.size()) {
             log.warn("Số lượng sản phẩm trả về ({}) không khớp số lượng yêu cầu ({})", productDtos.size(), productIds.size());
             throw new IllegalArgumentException("Không thể lấy thông tin đầy đủ cho tất cả sản phẩm được yêu cầu. Một số sản phẩm có thể không tồn tại.");
        }
        log.info("Lấy được thông tin {} sản phẩm.", productDtos.size());

        // Chuyển sang Map để tra cứu thông tin (bao gồm tên và giá)
        Map<Long, ProductDto> productMap = productDtos.stream()
                .collect(Collectors.toMap(ProductDto::id, dto -> dto));

        // --- 3. Tạo đối tượng Order và OrderItem ---
        Order order = Order.builder()
                .userId(userId) // Sử dụng userId thật
                .status(OrderStatus.PENDING) // Trạng thái ban đầu
                .build(); // totalAmount sẽ được tính và set sau

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : orderRequest.items()) {
            // Validation số lượng
            if (itemRequest.quantity() <= 0) {
                log.warn("Số lượng không hợp lệ cho productId {}: {}", itemRequest.productId(), itemRequest.quantity());
                throw new IllegalArgumentException("Số lượng sản phẩm " + itemRequest.productId() + " phải lớn hơn 0.");
            }

            Long productId = itemRequest.productId();
            ProductDto product = productMap.get(productId);
            
            // Lấy thông tin snapshot
            BigDecimal price = product.price();
            String name = product.name();

            // Validation giá
            if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
                log.error("Giá sản phẩm không hợp lệ cho productId {}: {}", productId, price);
                throw new IllegalStateException("Lỗi dữ liệu: Giá sản phẩm " + productId + " không hợp lệ.");
            }

            // Tạo OrderItem với thông tin snapshot
            OrderItem orderItem = OrderItem.builder()
                    .productId(productId)
                    .productName(name)
                    .quantity(itemRequest.quantity())
                    .price(price) 
                    .build();
            
            order.addItem(orderItem); // Thêm item vào order (và set quan hệ 2 chiều)

            // Cộng dồn tổng tiền
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(itemRequest.quantity())));
        }

        // Validation tổng tiền
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            log.error("Tổng tiền không hợp lệ: {}", totalAmount);
            throw new IllegalStateException("Lỗi tính toán: Tổng tiền đơn hàng không thể âm.");
        }
        order.setTotalAmount(totalAmount);
        log.info("Tổng tiền đơn hàng được tính toán: {}", totalAmount);

        // --- 4. Lưu vào CSDL (do cascade = CascadeType.ALL, OrderItems sẽ tự động được lưu) ---
        Order savedOrder = orderRepository.save(order);
        log.info("Đã lưu đơn hàng thành công với ID: {}", savedOrder.getId());

        // --- 5. Chuyển đổi sang DTO để trả về ---
        return mapOrderToOrderResponse(savedOrder);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true) // Giao dịch chỉ đọc (tối ưu hiệu năng)
    public Page<OrderResponse> getOrders(String userEmail, String bearerToken, Pageable pageable) {
        log.info("Lấy danh sách đơn hàng cho email: {} với pageable: {}", userEmail, pageable);

        // 1. Lấy userId từ UserServiceClient (để đảm bảo user là chính chủ)
        UserDto userDto = userServiceClient.getCurrentUser(bearerToken);
        Long userId = userDto.id();
        log.info("Lấy được userId: {} cho email: {}", userId, userEmail);

        // 2. Gọi Repository với userId
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        log.info("Tìm thấy {} đơn hàng trên trang này (tổng cộng {} đơn hàng)",
                 orderPage.getNumberOfElements(), orderPage.getTotalElements());

        // 3. Map kết quả Page<Order> sang Page<OrderResponse>
        return orderPage.map(this::mapOrderToOrderResponse);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, String userEmail, String bearerToken) {
        log.info("Lấy chi tiết đơn hàng ID: {} cho email: {}", orderId, userEmail);

        // 1. Lấy userId từ UserServiceClient
        UserDto userDto = userServiceClient.getCurrentUser(bearerToken);
        Long userId = userDto.id();
        log.info("Lấy được userId: {} cho email: {}", userId, userEmail);

        // 2. Gọi Repository với orderId VÀ userId để kiểm tra quyền sở hữu
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> {
                    // Log lý do cụ thể
                    log.warn("Không tìm thấy đơn hàng ID: {} hoặc không thuộc userId: {} (email: {})", orderId, userId, userEmail);
                    // Ném lỗi 404
                    return new OrderNotFoundException("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.");
                });

        log.info("Tìm thấy đơn hàng ID: {}", order.getId());
        // 3. Map kết quả
        return mapOrderToOrderResponse(order);
    }

    /**
     * Phương thức helper private để chuyển đổi Order (Entity) sang OrderResponse (DTO).
     * @param order Entity Order cần chuyển đổi.
     * @return DTO OrderResponse.
     */
    private OrderResponse mapOrderToOrderResponse(Order order) {
        // Kiểm tra đầu vào
        if (order == null) {
            return null;
        }

        List<OrderItemResponse> itemResponses;
        if (order.getItems() != null) {
            itemResponses = order.getItems().stream()
                    .map(item -> new OrderItemResponse(
                            item.getId(),
                            item.getProductId(),
                            item.getProductName(),
                            item.getQuantity(),
                            item.getPrice()))
                    .collect(Collectors.toList());
        } else {
            itemResponses = List.of(); // Trả về list rỗng nếu items là null
        }

        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getStatus() != null ? order.getStatus().name() : null, // Kiểm tra status null
                order.getTotalAmount(),
                itemResponses,
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}

