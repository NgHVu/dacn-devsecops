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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.OffsetDateTime; // Import thêm để convert
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

    private void triggerEmailNotification(Order order, String token) {
        try {
            List<SendOrderEmailRequest.OrderItemDto> itemDtos = order.getItems().stream()
                .map(item -> new SendOrderEmailRequest.OrderItemDto(
                        item.getProductName(), 
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
            log.error("Lỗi khi tạo request gửi mail: {}", e.getMessage());
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

            Long productId = itemRequest.productId();
            ProductDto product = productMap.get(productId);
            
            BigDecimal price = product.price();
            String name = product.name();
            String image = product.image();

            OrderItem orderItem = OrderItem.builder()
                    .productId(productId)
                    .productName(name)
                    .quantity(itemRequest.quantity())
                    .price(price)
                    .productImage(image)
                    .note(itemRequest.note())
                    .build();
            
            order.addItem(orderItem);
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(itemRequest.quantity())));
        }

        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        log.info("Đã lưu đơn hàng thành công với ID: {}", savedOrder.getId());

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
    public OrderResponse updateOrderStatus(Long orderId, OrderStatusUpdate statusUpdate) {
        log.info("Admin yêu cầu cập nhật trạng thái đơn hàng ID: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        OrderStatus newStatus;
        try {
            if (statusUpdate.getStatus() == null) throw new IllegalArgumentException("Status không được null");
            newStatus = OrderStatus.valueOf(statusUpdate.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + statusUpdate.getStatus());
        }

        validateStatusTransition(order.getStatus(), newStatus);

        log.info("Chuyển đổi trạng thái đơn hàng {}: {} -> {}", orderId, order.getStatus(), newStatus);
        order.setStatus(newStatus);
        
        order.setUpdatedAt(Instant.now());
        
        Order savedOrder = orderRepository.save(order);

        triggerEmailNotification(savedOrder, "");

        return mapOrderToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        OrderStatus cancelledStatus = OrderStatus.CANCELLED;

        BigDecimal totalRevenue = orderRepository.sumTotalRevenue(cancelledStatus);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        long totalOrders = orderRepository.count();

        Instant now = Instant.now();
        ZonedDateTime zdtNow = now.atZone(ZoneOffset.UTC);
        
        Instant startOfMonth = zdtNow.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        
        // FIX 1: Convert Instant -> OffsetDateTime cho Repository
        long newCustomers = orderRepository.countDistinctUsersInPeriod(
            startOfMonth.atOffset(ZoneOffset.UTC), 
            now.atOffset(ZoneOffset.UTC)
        );

        double revenueGrowth = calculateRevenueGrowth(now, cancelledStatus);

        List<MonthlyRevenue> rawMonthlyStats = orderRepository.getMonthlyRevenue(cancelledStatus);
        
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
                chartData,
                recentSales
        );
    }
    
    private double calculateRevenueGrowth(Instant now, OrderStatus cancelledStatus) {
        ZonedDateTime zdtNow = now.atZone(ZoneOffset.UTC);
        
        Instant startOfThisMonth = zdtNow.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        Instant startOfLastMonth = zdtNow.minusMonths(1).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
        Instant endOfLastMonth = startOfThisMonth.minusMillis(1); 

        // FIX 2: Convert Instant -> OffsetDateTime cho Repository
        BigDecimal thisMonthRev = orderRepository.sumRevenueInPeriod(
            startOfThisMonth.atOffset(ZoneOffset.UTC), 
            now.atOffset(ZoneOffset.UTC), 
            cancelledStatus
        );
        if (thisMonthRev == null) thisMonthRev = BigDecimal.ZERO;
        
        BigDecimal lastMonthRev = orderRepository.sumRevenueInPeriod(
            startOfLastMonth.atOffset(ZoneOffset.UTC), 
            endOfLastMonth.atOffset(ZoneOffset.UTC), 
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

        List<OrderItemResponse> itemResponses = (order.getItems() != null) 
                ? order.getItems().stream()
                    .map(item -> new OrderItemResponse(
                            item.getId(),
                            item.getProductId(),
                            item.getProductName(),
                            item.getQuantity(),
                            item.getPrice()))
                    .collect(Collectors.toList())
                : List.of();

        // FIX 3: Convert Instant -> OffsetDateTime cho DTO OrderResponse
        // Vì DTO OrderResponse của bạn vẫn dùng OffsetDateTime, nên phải convert ngược lại
        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getStatus() != null ? order.getStatus().name() : null,
                order.getTotalAmount(),
                itemResponses,
                order.getCreatedAt() != null ? order.getCreatedAt().atOffset(ZoneOffset.UTC) : null,
                order.getUpdatedAt() != null ? order.getUpdatedAt().atOffset(ZoneOffset.UTC) : null
        );
    }
}