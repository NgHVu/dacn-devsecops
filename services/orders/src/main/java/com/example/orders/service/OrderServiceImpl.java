package com.example.orders.service;

import com.example.orders.dto.*;
import com.example.orders.entity.Order;
import com.example.orders.entity.OrderItem;
import com.example.orders.entity.OrderStatus;
import com.example.orders.exception.OrderNotFoundException;
import com.example.orders.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate; // [NEW] Import RestTemplate

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserServiceClient userServiceClient;
    private final ProductServiceClient productServiceClient;

    // Hàm này xử lý việc gửi thông báo (Email/Serverless)
    private void triggerEmailNotification(Order order, String token) {
        // CÁCH 1: Gửi qua User Service (Logic cũ của bạn - Giữ nguyên nếu muốn)
        try {
            List<SendOrderEmailRequest.OrderItemDto> itemDtos = order.getItems().stream()
                .map(item -> new SendOrderEmailRequest.OrderItemDto(
                        item.getProductName() + (item.getSize() != null ? " (" + item.getSize() + ")" : ""), 
                        item.getQuantity(), 
                        item.getPrice()))
                .collect(Collectors.toList());

            SendOrderEmailRequest emailRequest = SendOrderEmailRequest.builder()
                    .userId(order.getUserId())
                    .orderId(order.getId())
                    .status(order.getStatus().name())
                    .totalAmount(order.getTotalAmount())
                    .items(itemDtos)
                    .build();

            userServiceClient.sendOrderNotification(emailRequest, token);
        } catch (Exception e) {
            log.error("Lỗi khi gọi User Service gửi mail: {}", e.getMessage());
        }

        // ========================================================================
        // CÁCH 2: [NEW] GỌI AZURE FUNCTION (SERVERLESS) - YÊU CẦU BÀI TẬP
        // ========================================================================
        try {
            // TODO: Thay thế URL này bằng Function URL bạn đã copy từ Azure Portal
            // Ví dụ: https://foodhub-mailer.azurewebsites.net/api/HttpTrigger1
            String azureFunctionUrl = "https://foodhub-mailer-func.azurewebsites.net/api/HttpTrigger1"; 
            
            // Tạo URL có tham số (Query Param)
            // Trong thực tế, bạn nên gửi Email khách hàng thật vào đây
            String finalUrl = azureFunctionUrl + "?orderId=" + order.getId() + "&email=khachhang@demo.com";

            log.info("Đang kích hoạt Serverless Function tại: {}", finalUrl);

            // Sử dụng RestTemplate để gọi HTTP GET (Fire and Forget)
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(finalUrl, String.class);
            
            log.info("SERVERLESS RESPONSE: {}", response);
        } catch (Exception e) {
            // Lỗi ở đây không được làm chết luồng tạo đơn hàng chính
            log.error("Lỗi khi gọi Azure Serverless Function: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public OrderResponse createOrder(OrderCreateRequest orderRequest, String bearerToken) {
        log.info("Bắt đầu xử lý tạo đơn hàng mới...");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("Không có thông tin xác thực hợp lệ.");
        }
        
        UserDto userDto = userServiceClient.getCurrentUser(bearerToken);
        if (userDto == null || userDto.id() == null) {
             throw new IllegalStateException("Không thể lấy được ID người dùng từ User Service.");
        }
        Long userId = userDto.id();

        // 1. Lấy thông tin sản phẩm để snapshot giá
        Set<Long> productIds = orderRequest.items().stream()
                .map(OrderItemRequest::productId)
                .collect(Collectors.toSet());

        if (productIds.isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải có ít nhất một sản phẩm.");
        }

        List<ProductDto> productDtos = productServiceClient.getProductsByIds(productIds, bearerToken);

        if (productDtos.size() != productIds.size()) {
             throw new IllegalArgumentException("Một số sản phẩm không tồn tại hoặc không thể lấy thông tin.");
        }

        Map<Long, ProductDto> productMap = productDtos.stream()
                .collect(Collectors.toMap(ProductDto::id, dto -> dto));

        // 2. TRỪ TỒN KHO
        List<ProductStockRequest> stockRequests = orderRequest.items().stream()
                .map(item -> new ProductStockRequest(item.productId(), item.quantity()))
                .collect(Collectors.toList());
        
        try {
            productServiceClient.reduceStock(stockRequests, bearerToken);
        } catch (Exception e) {
            log.error("Lỗi khi trừ tồn kho: {}", e.getMessage());
            throw new IllegalStateException("Đặt hàng thất bại: " + e.getMessage()); 
        }

        // 3. Tạo Order Object
        Order order = Order.builder()
                .userId(userId)
                .customerName(orderRequest.customerName())
                .shippingAddress(orderRequest.shippingAddress())
                .phoneNumber(orderRequest.phoneNumber())
                .note(orderRequest.note())
                .status(OrderStatus.PENDING)
                .paymentMethod(orderRequest.paymentMethod() != null ? orderRequest.paymentMethod().toUpperCase() : "COD")
                .items(new ArrayList<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus("UNPAID");
        } else {
            order.setPaymentStatus("PAID");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : orderRequest.items()) {
            if (itemRequest.quantity() <= 0) {
                throw new IllegalArgumentException("Số lượng sản phẩm phải lớn hơn 0.");
            }

            ProductDto product = productMap.get(itemRequest.productId());
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productId(product.id())
                    .productName(product.name())
                    .quantity(itemRequest.quantity())
                    .price(product.price())
                    .productImage(product.image())
                    .size(itemRequest.size())
                    .note(itemRequest.note())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            
            order.addItem(orderItem);
            totalAmount = totalAmount.add(product.price().multiply(BigDecimal.valueOf(itemRequest.quantity())));
        }

        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        log.info("Đã lưu đơn hàng thành công với ID: {}", savedOrder.getId());

        // Kích hoạt thông báo (Bao gồm gọi Azure Function)
        triggerEmailNotification(savedOrder, bearerToken);

        return mapOrderToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(String userEmail, String bearerToken, Pageable pageable) {
        UserDto userDto = userServiceClient.getCurrentUser(bearerToken);
        return orderRepository.findByUserId(userDto.id(), pageable).map(this::mapOrderToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, String userEmail, String bearerToken) {
        UserDto userDto = userServiceClient.getCurrentUser(bearerToken);
        Order order = orderRepository.findByIdAndUserId(orderId, userDto.id())
                .orElseThrow(() -> new OrderNotFoundException("Không tìm thấy đơn hàng hoặc bạn không có quyền xem."));

        return mapOrderToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        log.info("Admin đang lấy toàn bộ danh sách đơn hàng...");
        return orderRepository.findAll(pageable).map(this::mapOrderToOrderResponse);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatusUpdate statusUpdate, String bearerToken) {
        log.info("Xử lý cập nhật trạng thái đơn hàng ID: {}", orderId);

        UserDto currentUser = userServiceClient.getCurrentUser(bearerToken);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        OrderStatus newStatus;
        try {
            if (statusUpdate.getStatus() == null) throw new IllegalArgumentException("Status không được null");
            newStatus = OrderStatus.valueOf(statusUpdate.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + statusUpdate.getStatus());
        }

        // Kiểm tra quyền (Authorization)
        if (!isAdmin) {
            if (!order.getUserId().equals(currentUser.id())) {
                log.warn("User {} cố gắng can thiệp đơn hàng {} của người khác.", currentUser.id(), orderId);
                throw new AccessDeniedException("Bạn không có quyền thay đổi đơn hàng của người khác.");
            }
            if (newStatus != OrderStatus.CANCELLED) {
                log.warn("User {} cố gắng chuyển trạng thái sang {} (không cho phép).", currentUser.id(), newStatus);
                throw new AccessDeniedException("Khách hàng chỉ có quyền hủy đơn hàng.");
            }
            if (order.getStatus() != OrderStatus.PENDING) {
                log.warn("User {} cố gắng hủy đơn {} đang ở trạng thái {}.", currentUser.id(), orderId, order.getStatus());
                throw new IllegalStateException("Không thể hủy đơn hàng đã được xác nhận hoặc đang giao. Vui lòng liên hệ bộ phận CSKH.");
            }
        } else {
            validateStatusTransition(order.getStatus(), newStatus);
        }

        // LOGIC HOÀN KHO
        if (newStatus == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED) {
            log.info("Đơn hàng {} bị hủy. Tiến hành hoàn kho...", orderId);
            List<ProductStockRequest> restoreRequests = order.getItems().stream()
                    .map(item -> new ProductStockRequest(item.getProductId(), item.getQuantity()))
                    .collect(Collectors.toList());
            
            try {
                productServiceClient.restoreStock(restoreRequests, bearerToken);
            } catch (Exception e) {
                log.error("LỖI HOÀN KHO cho đơn hàng {}: {}", orderId, e.getMessage());
            }
        }

        // Cập nhật
        log.info("Chuyển đổi trạng thái đơn hàng {}: {} -> {} (Bởi UserID: {})", 
                orderId, order.getStatus(), newStatus, currentUser.id());
        
        order.setStatus(newStatus);
        order.setUpdatedAt(Instant.now());
        
        Order savedOrder = orderRepository.save(order);
        
        // Gửi email thông báo trạng thái thay đổi
        triggerEmailNotification(savedOrder, bearerToken);

        return mapOrderToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        OrderStatus cancelledStatus = OrderStatus.CANCELLED;

        // [FIXED] Dùng Instant thay vì OffsetDateTime
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue(cancelledStatus);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        long totalOrders = orderRepository.count();

        Instant now = Instant.now();
        
        // [FIXED] Dùng Instant thay vì OffsetDateTime
        ZonedDateTime zdtNow = now.atZone(ZoneOffset.UTC);
        Instant startOfMonth = zdtNow.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        
        // [FIXED] Truyền Instant
        long newCustomers = orderRepository.countDistinctUsersInPeriod(startOfMonth, now);

        // [FIXED] Truyền Instant
        double revenueGrowth = calculateRevenueGrowth(now, cancelledStatus);

        List<MonthlyRevenue> rawMonthlyStats = orderRepository.getMonthlyRevenue(cancelledStatus);
        
        // Cần lấy tổng số sản phẩm đang active từ Product Service
        long activeProducts = 0; 
        try {
            // Giả định có API internal/products/count-active
            activeProducts = productServiceClient.countActiveProducts();
        } catch (Exception e) {
            log.warn("Không thể lấy số lượng sản phẩm active từ Product Service: {}", e.getMessage());
            // Giữ activeProducts = 0
        }


        List<DashboardStats.MonthlyStats> chartData = rawMonthlyStats.stream()
                .map(m -> new DashboardStats.MonthlyStats("Tháng " + m.month(), m.total()))
                .collect(Collectors.toList());

        Pageable top5 = PageRequest.of(0, 5, Sort.by("createdAt").descending());
        List<OrderResponse> recentSales = orderRepository.findAll(top5).stream()
                .map(this::mapOrderToOrderResponse)
                .collect(Collectors.toList());

        return new DashboardStats(
                totalRevenue,
                revenueGrowth,
                totalOrders,
                newCustomers,
                activeProducts, // [NEW] Thêm Active Products
                chartData,
                recentSales
        );
    }
    
    // [FIXED] Dùng Instant trong hàm tính tăng trưởng
    private double calculateRevenueGrowth(Instant now, OrderStatus cancelledStatus) {
        ZonedDateTime zdtNow = now.atZone(ZoneOffset.UTC);
        
        Instant startOfThisMonth = zdtNow.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        Instant startOfLastMonth = zdtNow.minusMonths(1).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        Instant endOfLastMonth = startOfThisMonth.minusMillis(1); 

        // [FIXED] Truyền Instant
        BigDecimal thisMonthRev = orderRepository.sumRevenueInPeriod(
            startOfThisMonth, 
            now, 
            cancelledStatus
        );
        if (thisMonthRev == null) thisMonthRev = BigDecimal.ZERO;
        
        // [FIXED] Truyền Instant
        BigDecimal lastMonthRev = orderRepository.sumRevenueInPeriod(
            startOfLastMonth, 
            endOfLastMonth, 
            cancelledStatus
        );
        if (lastMonthRev == null) lastMonthRev = BigDecimal.ZERO;

        if (lastMonthRev.compareTo(BigDecimal.ZERO) == 0) {
            return thisMonthRev.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }

        return thisMonthRev.subtract(lastMonthRev)
                .divide(lastMonthRev, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        if (currentStatus == newStatus) return;
        if (currentStatus == OrderStatus.DELIVERED || currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Không thể cập nhật đơn hàng đã hoàn tất.");
        }
        
        if (currentStatus == OrderStatus.PENDING && 
           (newStatus != OrderStatus.CONFIRMED && newStatus != OrderStatus.CANCELLED)) {
             throw new IllegalStateException("PENDING chỉ có thể sang CONFIRMED hoặc CANCELLED");
        }
        if (currentStatus == OrderStatus.CONFIRMED && 
           (newStatus != OrderStatus.SHIPPING && newStatus != OrderStatus.CANCELLED)) {
             throw new IllegalStateException("CONFIRMED chỉ có thể sang SHIPPING hoặc CANCELLED");
        }
        if (currentStatus == OrderStatus.SHIPPING && 
           (newStatus != OrderStatus.DELIVERED && newStatus != OrderStatus.CANCELLED)) {
             throw new IllegalStateException("SHIPPING chỉ có thể sang DELIVERED hoặc CANCELLED");
        }
    }

    private OrderResponse mapOrderToOrderResponse(Order order) {
        if (order == null) return null;

        List<OrderItemResponse> itemResponses =
                (order.getItems() != null)
                        ? order.getItems().stream()
                            .map(item -> new OrderItemResponse(
                                    item.getId(),
                                    item.getProductId(),
                                    item.getProductName(),
                                    item.getQuantity(),
                                    item.getPrice(),
                                    item.getProductImage(),
                                    item.getSize(),
                                    item.getNote()
                            ))
                            .collect(Collectors.toList())
                        : List.of();

        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getStatus() != null ? order.getStatus().name() : null,
                order.getTotalAmount(),

                order.getCustomerName(),
                order.getShippingAddress(),
                order.getPhoneNumber(),
                order.getNote(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),

                itemResponses,
                // Giữ nguyên OffsetDateTime ở Response DTO cho tương thích FE
                order.getCreatedAt() != null ? order.getCreatedAt().atOffset(ZoneOffset.UTC) : null,
                order.getUpdatedAt() != null ? order.getUpdatedAt().atOffset(ZoneOffset.UTC) : null
        );
    }
}