package com.example.orders.service;

import com.example.orders.dto.external.ProductDto; 
import com.example.orders.dto.external.UserDto;   
import com.example.orders.dto.request.OrderCreateRequest;
import com.example.orders.dto.request.OrderItemRequest;
import com.example.orders.dto.response.OrderItemResponse;
import com.example.orders.dto.response.OrderResponse;
import com.example.orders.entity.Order;
import com.example.orders.entity.OrderItem;
import com.example.orders.entity.OrderStatus;
import com.example.orders.exception.OrderNotFoundException;
import com.example.orders.repository.OrderRepository;
// import com.example.orders.service.client.ProductServiceClient;
// import com.example.orders.service.client.UserServiceClient;
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
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono; 

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
    // private final UserServiceClient userServiceClient;
    // private final ProductServiceClient productServiceClient;

    // Inject Bean WebClient từ WebClientConfig
    private final WebClient webClient;

    // Inject URLs từ application.properties
    @Value("${app.client.users-service.url}")
    private String usersServiceUrl;

    @Value("${app.client.products-service.url}")
    private String productsServiceUrl;


    @Override
    @Transactional // Đảm bảo lưu Order và OrderItems là một giao dịch
    public OrderResponse createOrder(OrderCreateRequest orderRequest, String bearerToken) {
        log.info("Bắt đầu tạo đơn hàng mới..."); 

        // 1. Lấy thông tin người dùng từ Security Context 
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            log.warn("Không thể lấy thông tin xác thực từ Security Context.");
            // Dùng Exception của Spring Security
            throw new BadCredentialsException("Không có thông tin xác thực hợp lệ.");
        }

        String userEmail = authentication.getName(); // Đây là email lấy từ subject của JWT token
        log.info("Đã xác thực người dùng với email: {}", userEmail);

        // 2. Gọi User Service để lấy User ID 
        // Chuyển logic này vào UserServiceClient
        // Cần đảm bảo users-service có endpoint /api/users/by-email?email=...
        String userUri = usersServiceUrl + "/api/users/by-email?email=" + userEmail;
        log.debug("Gọi User Service URI: {}", userUri);

        UserDto userDto = webClient.get()
                .uri(userUri)
                .header("Authorization", bearerToken) // Gửi token theo để xác thực
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response -> {
                     log.error("Lỗi Client khi gọi User Service ({}): {}", response.statusCode(), userUri);
                     return Mono.error(new BadCredentialsException("Không tìm thấy thông tin người dùng với email: " + userEmail));
                })
                .onStatus(HttpStatusCode::is5xxServerError, response -> {
                     log.error("Lỗi Server khi gọi User Service ({}): {}", response.statusCode(), userUri);
                     return Mono.error(new RuntimeException("Lỗi khi kết nối đến dịch vụ người dùng."));
                })
                .bodyToMono(UserDto.class)
                .block(); 

        if (userDto == null || userDto.id() == null) {
             log.error("Không nhận được ID người dùng hợp lệ từ User Service cho email: {}", userEmail);
             throw new IllegalStateException("Không thể lấy được ID người dùng từ User Service.");
        }

        Long userId = userDto.id(); 
        log.info("Lấy được userId thật: {}", userId);

        // 3. Lấy thông tin sản phẩm và kiểm tra tồn kho từ Products Service 
        Set<Long> productIds = orderRequest.items().stream()
                .map(OrderItemRequest::productId)
                .collect(Collectors.toSet());
        log.info("Danh sách productId cần kiểm tra: {}", productIds);

        if (productIds.isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải có ít nhất một sản phẩm.");
        }

        // Tạo URI cho request lấy product
        String productUri = productsServiceUrl + "/api/v1/products/by-ids?ids=" +
                            productIds.stream().map(String::valueOf).collect(Collectors.joining(","));

        log.debug("Gọi Product Service URI: {}", productUri); // Log URI 

        // Gọi API sang Products Service để lấy thông tin chi tiết các sản phẩm
        // Chuyển logic này vào ProductServiceClient
        List<ProductDto> productDtos = webClient.get()
                .uri(productUri)
                .header("Authorization", bearerToken) // Gửi token theo
                .retrieve()
                 // Xử lý lỗi HTTP cơ bản
                .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> {
                    log.error("Lỗi Client khi gọi Product Service ({}): {}", clientResponse.statusCode(), productUri);
                    // Có thể đọc body lỗi nếu cần
                    return Mono.error(new IllegalArgumentException("Một hoặc nhiều sản phẩm không hợp lệ hoặc không tìm thấy."));
                })
                .onStatus(HttpStatusCode::is5xxServerError, clientResponse -> {
                    log.error("Lỗi Server khi gọi Product Service ({}): {}", clientResponse.statusCode(), productUri);
                    return Mono.error(new RuntimeException("Lỗi khi kết nối đến dịch vụ sản phẩm."));
                })
                .bodyToFlux(ProductDto.class) // Nhận về danh sách ProductDto
                .collectList()
                .block();

        // Kiểm tra xem có lấy đủ thông tin sản phẩm không
        if (productDtos == null || productDtos.size() != productIds.size()) {
             log.error("Số lượng sản phẩm trả về ({}) không khớp với số lượng yêu cầu ({}) cho các ID: {}",
                     productDtos != null ? productDtos.size() : 0, productIds.size(), productIds);
             throw new IllegalArgumentException("Không thể lấy thông tin đầy đủ cho tất cả sản phẩm được yêu cầu.");
        }
        log.info("Lấy được thông tin {} sản phẩm.", productDtos.size());


        // Chuyển danh sách thành Map để dễ tra cứu giá
        Map<Long, BigDecimal> productPrices = productDtos.stream()
                .collect(Collectors.toMap(ProductDto::id, ProductDto::price));

        // 4. Tạo đối tượng Order và OrderItem 
        Order order = Order.builder()
                .userId(userId) // Sử dụng userId thật
                .status(OrderStatus.PENDING) // Trạng thái ban đầu
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : orderRequest.items()) {
            if (itemRequest.quantity() <= 0) {
                 log.warn("Số lượng không hợp lệ cho productId {}: {}", itemRequest.productId(), itemRequest.quantity());
                 throw new IllegalArgumentException("Số lượng sản phẩm phải lớn hơn 0.");
            }

            Long productId = itemRequest.productId();
            Integer quantity = itemRequest.quantity();
            BigDecimal price = productPrices.get(productId);

            if (price == null) {
                log.error("Không tìm thấy giá đã cache cho productId: {}", productId);
                throw new IllegalStateException("Lỗi nội bộ: Không tìm thấy giá sản phẩm sau khi đã fetch.");
            }
             if (price.compareTo(BigDecimal.ZERO) < 0) {
                 log.error("Giá sản phẩm không hợp lệ cho productId {}: {}", productId, price);
                 throw new IllegalStateException("Lỗi dữ liệu: Giá sản phẩm không thể âm.");
             }


            OrderItem orderItem = OrderItem.builder()
                    .productId(productId)
                    .quantity(quantity)
                    .price(price) // Lưu giá tại thời điểm đặt hàng
                    .build();

            order.addItem(orderItem); // Thêm item vào order (và thiết lập quan hệ 2 chiều)

            // Cộng dồn vào tổng tiền
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(quantity)));
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
             log.error("Tổng tiền không hợp lệ: {}", totalAmount);
             throw new IllegalStateException("Lỗi tính toán: Tổng tiền đơn hàng không thể âm.");
        }

        order.setTotalAmount(totalAmount); // Cập nhật tổng tiền
        log.info("Tổng tiền đơn hàng được tính toán: {}", totalAmount);

        // 5. Lưu vào CSDL 
        Order savedOrder = orderRepository.save(order);
        log.info("Đã lưu đơn hàng thành công với ID: {}", savedOrder.getId());

        // 6. Chuyển đổi sang DTO để trả về 
        return mapOrderToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true) // Chỉ đọc, không thay đổi dữ liệu
    public Page<OrderResponse> getOrdersByUserId(Long userId, Pageable pageable) {
        log.info("Lấy danh sách đơn hàng cho userId: {} với pageable: {}", userId, pageable);
        // Kiểm tra userId null 
        if (userId == null) {
             throw new IllegalArgumentException("User ID không được để trống.");
        }
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        log.info("Tìm thấy {} đơn hàng trên trang này (tổng cộng {} đơn hàng)",
                 orderPage.getNumberOfElements(), orderPage.getTotalElements());
        // Chuyển đổi Page<Order> thành Page<OrderResponse>
        return orderPage.map(this::mapOrderToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdAndUserId(Long orderId, Long userId) {
        log.info("Lấy chi tiết đơn hàng ID: {} cho userId: {}", orderId, userId);
         // Kiểm tra orderId và userId null 
         if (orderId == null || userId == null) {
             throw new IllegalArgumentException("Order ID và User ID không được để trống.");
         }
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> {
                    log.warn("Không tìm thấy đơn hàng ID: {} hoặc không thuộc userId: {}", orderId, userId);
                    // Nên dùng Exception cụ thể hơn là RuntimeException chung chung
                    return new OrderNotFoundException("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.");
                });
        log.info("Tìm thấy đơn hàng ID: {}", order.getId());
        return mapOrderToOrderResponse(order);
    }

    // Phương thức private helper để chuyển đổi Entity sang DTO 
    private OrderResponse mapOrderToOrderResponse(Order order) {
        // Kiểm tra null cho order và items để tránh NullPointerException
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

