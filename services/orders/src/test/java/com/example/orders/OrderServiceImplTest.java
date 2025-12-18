package com.example.orders;

import com.example.orders.dto.*;
import com.example.orders.entity.Order;
import com.example.orders.entity.OrderItem;
import com.example.orders.entity.OrderStatus;
import com.example.orders.exception.OrderNotFoundException;
import com.example.orders.repository.OrderRepository;
import com.example.orders.service.ProductServiceClient;
import com.example.orders.service.UserServiceClient;
import com.example.orders.service.OrderServiceImpl;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderServiceImpl Tests - High Coverage")
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private UserServiceClient userServiceClient;
    @Mock
    private ProductServiceClient productServiceClient;
    @Mock
    private Authentication authentication;
    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private OrderServiceImpl orderService;

    private UserDto mockUserDto;
    private ProductDto mockProduct1, mockProduct2;
    private OrderCreateRequest mockOrderRequest;
    private final String MOCK_TOKEN = "Bearer fake.token.string";
    private final String MOCK_EMAIL = "test@example.com";
    private final Long MOCK_USER_ID = 1L;

    @BeforeEach
    void setUp() {
        // FIX: Sửa constructor UserDto về 3 tham số (id, name, email)
        mockUserDto = new UserDto(MOCK_USER_ID, "Test User", MOCK_EMAIL);
        
        mockProduct1 = new ProductDto(101L, "Sản phẩm 1", new BigDecimal("50.00"), "img1.jpg", 100);
        mockProduct2 = new ProductDto(102L, "Sản phẩm 2", new BigDecimal("100.00"), "img2.jpg", 50);
        
        OrderItemRequest item1 = new OrderItemRequest(101L, 2, "L", "Ít đá");
        OrderItemRequest item2 = new OrderItemRequest(102L, 1, null, null);
        
        mockOrderRequest = new OrderCreateRequest(
                "Khách Hàng Test",
                "123 Đường Test",
                "0909123456",
                "Ghi chú đơn hàng",
                "COD",
                List.of(item1, item2)
        );

        // Setup default security context
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getName()).thenReturn(MOCK_EMAIL);
        lenient().when(authentication.getAuthorities()).thenReturn((List) List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // --- CREATE ORDER TESTS ---

    @Test
    @DisplayName("createOrder: Tạo đơn hàng thành công (Happy Path)")
    void testCreateOrder_Success() {
        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        Set<Long> productIds = Set.of(101L, 102L);
        
        when(productServiceClient.getProductsByIds(productIds, MOCK_TOKEN))
                .thenReturn(List.of(mockProduct1, mockProduct2));
                
        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        when(orderRepository.save(orderCaptor.capture())).thenAnswer(invocation -> {
            Order orderToSave = invocation.getArgument(0);
            orderToSave.setId(1L);
            long itemId = 10;
            for(var item : orderToSave.getItems()) {
                item.setId(itemId++);
            }
            return orderToSave;
        });

        OrderResponse response = orderService.createOrder(mockOrderRequest, MOCK_TOKEN);

        assertThat(response).isNotNull();
        assertThat(response.userId()).isEqualTo(MOCK_USER_ID);
        assertThat(response.status()).isEqualTo(OrderStatus.PENDING.name());
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("200.00")); 
        
        verify(productServiceClient).reduceStock(anyList(), eq(MOCK_TOKEN));
        verify(userServiceClient).sendOrderNotification(any(SendOrderEmailRequest.class), eq(MOCK_TOKEN));
    }

    @Test
    @DisplayName("createOrder: Thất bại khi reduceStock ném lỗi")
    void testCreateOrder_ReduceStockFail() {
        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(productServiceClient.getProductsByIds(anySet(), eq(MOCK_TOKEN)))
                .thenReturn(List.of(mockProduct1, mockProduct2));
        
        doThrow(new IllegalStateException("Out of stock"))
                .when(productServiceClient).reduceStock(anyList(), eq(MOCK_TOKEN));

        assertThrows(IllegalStateException.class, () -> 
            orderService.createOrder(mockOrderRequest, MOCK_TOKEN));
            
        verify(orderRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("createOrder: Ném lỗi BadCredentialsException khi không có Authentication")
    void testCreateOrder_NoAuth_ShouldThrowException() {
        SecurityContextHolder.clearContext();
        assertThrows(BadCredentialsException.class, () -> {
            orderService.createOrder(mockOrderRequest, MOCK_TOKEN);
        });
        verifyNoInteractions(userServiceClient, productServiceClient, orderRepository);
    }

    @Test
    @DisplayName("createOrder: Ném lỗi khi User Service trả về null")
    void testCreateOrder_UserNotFound() {
        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(null);
        assertThrows(IllegalStateException.class, () -> orderService.createOrder(mockOrderRequest, MOCK_TOKEN));
    }

    // --- GET ORDERS TESTS ---

    @Test
    @DisplayName("getOrders: Lấy danh sách đơn hàng (Pageable) thành công")
    void testGetOrders_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Order mockOrder = Order.builder().id(1L).userId(MOCK_USER_ID).status(OrderStatus.DELIVERED).totalAmount(BigDecimal.TEN).build();
        Page<Order> mockPage = new PageImpl<>(List.of(mockOrder), pageable, 1);

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findByUserId(MOCK_USER_ID, pageable)).thenReturn(mockPage);

        Page<OrderResponse> responsePage = orderService.getOrders(MOCK_EMAIL, MOCK_TOKEN, pageable);

        assertThat(responsePage.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("getOrderById: Lấy chi tiết đơn hàng thành công")
    void testGetOrderById_Success() {
        Long orderId = 1L;
        Order mockOrder = Order.builder().id(orderId).userId(MOCK_USER_ID).status(OrderStatus.DELIVERED).totalAmount(BigDecimal.TEN).build();

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findByIdAndUserId(orderId, MOCK_USER_ID)).thenReturn(Optional.of(mockOrder));

        OrderResponse response = orderService.getOrderById(orderId, MOCK_EMAIL, MOCK_TOKEN);

        assertThat(response.id()).isEqualTo(orderId);
    }

    @Test
    @DisplayName("getAllOrders: Admin lấy toàn bộ đơn hàng")
    void testGetAllOrders_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        when(orderRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(new Order())));
        
        Page<OrderResponse> result = orderService.getAllOrders(pageable);
        assertThat(result).isNotEmpty();
    }

    // --- UPDATE STATUS TESTS (COMPLEX LOGIC) ---

    @Test
    @DisplayName("updateOrderStatus: User hủy đơn hàng PENDING -> Thành công & Hoàn kho")
    void testUpdateStatus_UserCancelPending_Success() {
        Long orderId = 1L;
        Order mockOrder = Order.builder()
                .id(orderId)
                .userId(MOCK_USER_ID)
                .status(OrderStatus.PENDING)
                .items(List.of(OrderItem.builder().productId(101L).quantity(2).build()))
                .build();
        
        OrderStatusUpdate update = new OrderStatusUpdate();
        update.setStatus("CANCELLED");

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(orderId, update, MOCK_TOKEN);

        assertThat(response.status()).isEqualTo("CANCELLED");
        verify(productServiceClient).restoreStock(anyList(), eq(MOCK_TOKEN));
        verify(userServiceClient).sendOrderNotification(any(), eq(MOCK_TOKEN));
    }

    @Test
    @DisplayName("updateOrderStatus: User cố cập nhật đơn của người khác -> 403 Forbidden")
    void testUpdateStatus_AccessDenied_OtherUser() {
        Long orderId = 1L;
        Order mockOrder = Order.builder().id(orderId).userId(999L).build(); 
        OrderStatusUpdate update = new OrderStatusUpdate();
        update.setStatus("CANCELLED");

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

        assertThrows(AccessDeniedException.class, () -> 
            orderService.updateOrderStatus(orderId, update, MOCK_TOKEN));
    }

    @Test
    @DisplayName("updateOrderStatus: User cố chuyển trạng thái không phải CANCELLED -> 403")
    void testUpdateStatus_UserInvalidStatusChange() {
        Long orderId = 1L;
        Order mockOrder = Order.builder().id(orderId).userId(MOCK_USER_ID).status(OrderStatus.PENDING).build();
        OrderStatusUpdate update = new OrderStatusUpdate();
        update.setStatus("CONFIRMED"); 

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

        assertThrows(AccessDeniedException.class, () -> 
            orderService.updateOrderStatus(orderId, update, MOCK_TOKEN));
    }

    @Test
    @DisplayName("updateOrderStatus: Admin cập nhật PENDING -> CONFIRMED -> Thành công")
    void testUpdateStatus_Admin_Success() {
        when(authentication.getAuthorities()).thenReturn((List) List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        
        Long orderId = 1L;
        Order mockOrder = Order.builder().id(orderId).userId(999L).status(OrderStatus.PENDING).items(List.of()).build();
        OrderStatusUpdate update = new OrderStatusUpdate();
        update.setStatus("CONFIRMED");

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(orderId, update, MOCK_TOKEN);
        
        assertThat(response.status()).isEqualTo("CONFIRMED");
    }

    @Test
    @DisplayName("updateOrderStatus: Lỗi chuyển đổi trạng thái không hợp lệ (Shipping -> Pending)")
    void testUpdateStatus_InvalidTransition() {
        when(authentication.getAuthorities()).thenReturn((List) List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        
        Order mockOrder = Order.builder().id(1L).status(OrderStatus.SHIPPING).build();
        OrderStatusUpdate update = new OrderStatusUpdate();
        update.setStatus("PENDING"); 

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));

        assertThrows(IllegalStateException.class, () -> 
            orderService.updateOrderStatus(1L, update, MOCK_TOKEN));
    }

    // --- DASHBOARD TESTS ---

    @Test
    @DisplayName("getDashboardStats: Thành công")
    void testGetDashboardStats() {
        // Mock repository methods
        when(orderRepository.sumTotalRevenue(any())).thenReturn(new BigDecimal("1000000"));
        when(orderRepository.count()).thenReturn(50L);
        when(orderRepository.countDistinctUsersInPeriod(any(), any())).thenReturn(10L);
        when(orderRepository.getMonthlyRevenue(any())).thenReturn(Collections.emptyList());
        when(orderRepository.sumRevenueInPeriod(any(), any(), any())).thenReturn(new BigDecimal("500000")); 

        // [FIX] Mock findAll(Pageable) để tránh NullPointerException khi lấy sales mới nhất
        when(orderRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(Collections.emptyList()));

        // Mock product service call
        when(productServiceClient.countActiveProducts()).thenReturn(100L);

        DashboardStats stats = orderService.getDashboardStats();

        assertThat(stats).isNotNull();
        assertThat(stats.totalRevenue()).isEqualByComparingTo(new BigDecimal("1000000"));
        assertThat(stats.activeProducts()).isEqualTo(100L);
    }
    
    @Test
    @DisplayName("getDashboardStats: Product Service lỗi -> vẫn trả về stats với activeProducts = 0")
    void testGetDashboardStats_ProductServiceFail() {
        when(orderRepository.sumTotalRevenue(any())).thenReturn(BigDecimal.ZERO);
        // [FIX] Mock findAll(Pageable) cho case lỗi
        when(orderRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(Collections.emptyList()));
        
        when(productServiceClient.countActiveProducts()).thenThrow(new RuntimeException("Service down"));

        DashboardStats stats = orderService.getDashboardStats();
        
        assertThat(stats.activeProducts()).isZero(); 
    }
}