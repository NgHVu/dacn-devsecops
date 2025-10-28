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
import com.example.orders.service.ProductServiceClient;
import com.example.orders.service.UserServiceClient;
import com.example.orders.service.OrderService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatusCode;
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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserServiceClient userServiceClient;
    private final ProductServiceClient productServiceClient;

    @Override
    @Transactional
    public OrderResponse createOrder(OrderCreateRequest orderRequest, String bearerToken) {
        log.info("Bắt đầu tạo đơn hàng mới...");

        // 1. Lấy User ID từ User Service
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            log.warn("Không thể lấy thông tin xác thực từ Security Context.");
            throw new BadCredentialsException("Không có thông tin xác thực hợp lệ.");
        }
        String userEmail = authentication.getName();
        log.info("Đã xác thực người dùng với email: {}", userEmail);

        // Gọi UserServiceClient
        UserDto userDto = userServiceClient.getUserByEmail(userEmail, bearerToken);
        Long userId = userDto.id(); // Lấy userId 
        log.info("Lấy được userId thật: {}", userId);

        // 2. Lấy thông tin sản phẩm từ Products Service 
        Set<Long> productIds = orderRequest.items().stream()
                .map(OrderItemRequest::productId)
                .collect(Collectors.toSet());
        log.info("Danh sách productId cần kiểm tra: {}", productIds);

        if (productIds.isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải có ít nhất một sản phẩm.");
        }

        // Gọi ProductServiceClient
        List<ProductDto> productDtos = productServiceClient.getProductsByIds(productIds, bearerToken);

        // Kiểm tra xem có lấy đủ thông tin sản phẩm không (Client đã xử lý lỗi và log)
        if (productDtos.size() != productIds.size()) {
             // Ném lỗi ở đây nếu bắt buộc phải có đủ thông tin
             throw new IllegalArgumentException("Không thể lấy thông tin đầy đủ cho tất cả sản phẩm được yêu cầu.");
        }
        log.info("Lấy được thông tin {} sản phẩm.", productDtos.size());

        Map<Long, BigDecimal> productPrices = productDtos.stream()
                .collect(Collectors.toMap(ProductDto::id, ProductDto::price));

        // 3. Tạo đối tượng Order và OrderItem
        Order order = Order.builder()
                .userId(userId) // Sử dụng userId 
                .status(OrderStatus.PENDING)
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : orderRequest.items()) {
            if (itemRequest.quantity() <= 0) {
                log.warn("Số lượng không hợp lệ cho productId {}: {}", itemRequest.productId(), itemRequest.quantity());
                throw new IllegalArgumentException("Số lượng sản phẩm phải lớn hơn 0.");
            }
            Long productId = itemRequest.productId();
            BigDecimal price = productPrices.get(productId);

            if (price == null) {
                log.error("Không tìm thấy giá đã cache cho productId: {}", productId);
                throw new IllegalStateException("Lỗi nội bộ: Không tìm thấy giá sản phẩm.");
            }
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                log.error("Giá sản phẩm không hợp lệ cho productId {}: {}", productId, price);
                throw new IllegalStateException("Lỗi dữ liệu: Giá sản phẩm không thể âm.");
            }

            OrderItem orderItem = OrderItem.builder()
                    .productId(productId)
                    .quantity(itemRequest.quantity())
                    .price(price)
                    .build();
            order.addItem(orderItem);
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(itemRequest.quantity())));
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            log.error("Tổng tiền không hợp lệ: {}", totalAmount);
            throw new IllegalStateException("Lỗi tính toán: Tổng tiền đơn hàng không thể âm.");
        }
        order.setTotalAmount(totalAmount);
        log.info("Tổng tiền đơn hàng được tính toán: {}", totalAmount);

        // 4. Lưu vào CSDL 
        Order savedOrder = orderRepository.save(order);
        log.info("Đã lưu đơn hàng thành công với ID: {}", savedOrder.getId());

        // 5. Chuyển đổi sang DTO để trả về 
        return mapOrderToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(String userEmail, String bearerToken, Pageable pageable) {
        log.info("Lấy danh sách đơn hàng cho email: {} với pageable: {}", userEmail, pageable);

        // 1. Lấy userId từ UserServiceClient
        UserDto userDto = userServiceClient.getUserByEmail(userEmail, bearerToken);
        Long userId = userDto.id();
        log.info("Lấy được userId: {} cho email: {}", userId, userEmail);

        // 2. Gọi Repository với userId
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        log.info("Tìm thấy {} đơn hàng trên trang này (tổng cộng {} đơn hàng)",
                 orderPage.getNumberOfElements(), orderPage.getTotalElements());

        // 3. Map kết quả
        return orderPage.map(this::mapOrderToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, String userEmail, String bearerToken) {
        log.info("Lấy chi tiết đơn hàng ID: {} cho email: {}", orderId, userEmail);

        // 1. Lấy userId từ UserServiceClient
        UserDto userDto = userServiceClient.getUserByEmail(userEmail, bearerToken);
        Long userId = userDto.id();
        log.info("Lấy được userId: {} cho email: {}", userId, userEmail);

        // 2. Gọi Repository với orderId và userId để kiểm tra quyền sở hữu
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy đơn hàng ID: {} hoặc không thuộc userId: {} (email: {})", orderId, userId, userEmail);
                    return new OrderNotFoundException("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.");
                });

        log.info("Tìm thấy đơn hàng ID: {}", order.getId());
        // 3. Map kết quả
        return mapOrderToOrderResponse(order);
    }

    // Phương thức private helper để chuyển đổi Entity sang DTO 
    private OrderResponse mapOrderToOrderResponse(Order order) {
        if (order == null) {
            return null;
        }

        List<OrderItemResponse> itemResponses;
        if (order.getItems() != null) {
            itemResponses = order.getItems().stream()
                    .map(item -> new OrderItemResponse(
                            item.getId(),
                            item.getProductId(),
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