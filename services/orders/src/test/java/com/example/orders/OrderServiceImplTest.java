package com.example.orders;

import com.example.orders.dto.ProductDto;
import com.example.orders.dto.UserDto;
import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderItemRequest;
import com.example.orders.dto.OrderResponse;

import com.example.orders.entity.Order;
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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderServiceImpl Tests")
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
        mockUserDto = new UserDto(MOCK_USER_ID, "Test User", MOCK_EMAIL);
        // Cập nhật ProductDto với constructor mới (thêm tham số image)
        mockProduct1 = new ProductDto(101L, "Sản phẩm 1", new BigDecimal("50.00"), "img1.jpg", 100);
        mockProduct2 = new ProductDto(102L, "Sản phẩm 2", new BigDecimal("100.00"), "img2.jpg", 50);
        
        // Cập nhật OrderItemRequest với constructor mới (thêm tham số note)
        OrderItemRequest item1 = new OrderItemRequest(101L, 2, "Ít đá");
        OrderItemRequest item2 = new OrderItemRequest(102L, 1, null);
        
        // Cập nhật OrderCreateRequest với constructor mới (thêm thông tin giao hàng)
        mockOrderRequest = new OrderCreateRequest(
                "Khách Hàng Test",
                "123 Đường Test",
                "0909123456",
                "Ghi chú đơn hàng",
                "COD",
                List.of(item1, item2)
        );

        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getName()).thenReturn(MOCK_EMAIL);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

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
        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("200.00")); // (50*2) + (100*1)
        assertThat(response.items()).hasSize(2);
        
        verify(userServiceClient, times(1)).getCurrentUser(MOCK_TOKEN);
        verify(productServiceClient, times(1)).getProductsByIds(productIds, MOCK_TOKEN);
        verify(orderRepository, times(1)).save(any(Order.class));

        Order savedOrder = orderCaptor.getValue();
        assertThat(savedOrder.getUserId()).isEqualTo(MOCK_USER_ID);
        // Kiểm tra xem note và image có được lưu đúng không
        assertThat(savedOrder.getItems()).anyMatch(item -> 
            item.getProductId().equals(101L) && "Ít đá".equals(item.getNote()) && "img1.jpg".equals(item.getProductImage())
        );
        assertThat(savedOrder.getPaymentMethod()).isEqualTo("COD");
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
    @DisplayName("createOrder: Ném lỗi IllegalArgumentException khi sản phẩm không đủ")
    void testCreateOrder_ProductMismatch_ShouldThrowException() {
        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        Set<Long> productIds = Set.of(101L, 102L);
        
        when(productServiceClient.getProductsByIds(productIds, MOCK_TOKEN))
                .thenReturn(List.of(mockProduct1)); // Chỉ trả về 1 sản phẩm thay vì 2

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(mockOrderRequest, MOCK_TOKEN);
        });
        
        assertThat(exception.getMessage()).contains("Một số sản phẩm không tồn tại");
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("createOrder: Ném lỗi IllegalArgumentException khi số lượng bằng 0")
    void testCreateOrder_InvalidQuantity_ShouldThrowException() {
        // Tạo request lỗi với số lượng 0
        OrderCreateRequest badRequest = new OrderCreateRequest(
                "Tên", "Địa chỉ", "SĐT", null, "COD",
                List.of(new OrderItemRequest(101L, 0, null))
        );
        
        // Mock user để pass qua bước xác thực đầu tiên
        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        
        // Mock product service để trả về sản phẩm (tránh lỗi product mismatch trước khi check quantity)
        Set<Long> productIds = Set.of(101L);
        when(productServiceClient.getProductsByIds(productIds, MOCK_TOKEN))
                .thenReturn(List.of(mockProduct1));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(badRequest, MOCK_TOKEN);
        });
        
        assertThat(exception.getMessage()).contains("Số lượng sản phẩm phải lớn hơn 0");
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("getOrders: Lấy danh sách đơn hàng (Pageable) thành công")
    void testGetOrders_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Order mockOrder = Order.builder().id(1L).userId(MOCK_USER_ID).status(OrderStatus.DELIVERED).totalAmount(BigDecimal.TEN).build();
        Page<Order> mockPage = new PageImpl<>(List.of(mockOrder), pageable, 1);

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findByUserId(MOCK_USER_ID, pageable)).thenReturn(mockPage);

        Page<OrderResponse> responsePage = orderService.getOrders(MOCK_EMAIL, MOCK_TOKEN, pageable);

        assertThat(responsePage).isNotNull();
        assertThat(responsePage.getTotalElements()).isEqualTo(1);
        assertThat(responsePage.getContent().get(0).id()).isEqualTo(1L);
        
        verify(userServiceClient, times(1)).getCurrentUser(MOCK_TOKEN);
        verify(orderRepository, times(1)).findByUserId(MOCK_USER_ID, pageable);
    }
    
    @Test
    @DisplayName("getOrderById: Lấy chi tiết đơn hàng thành công")
    void testGetOrderById_Success() {
        Long orderId = 1L;
        Order mockOrder = Order.builder().id(orderId).userId(MOCK_USER_ID).status(OrderStatus.DELIVERED).totalAmount(BigDecimal.TEN).build();

        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findByIdAndUserId(orderId, MOCK_USER_ID)).thenReturn(Optional.of(mockOrder));

        OrderResponse response = orderService.getOrderById(orderId, MOCK_EMAIL, MOCK_TOKEN);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(orderId);
        
        verify(userServiceClient, times(1)).getCurrentUser(MOCK_TOKEN);
        verify(orderRepository, times(1)).findByIdAndUserId(orderId, MOCK_USER_ID);
    }

    @Test
    @DisplayName("getOrderById: Ném lỗi OrderNotFoundException khi không tìm thấy")
    void testGetOrderById_NotFound_ShouldThrowException() {
        Long orderId = 99L;
        
        when(userServiceClient.getCurrentUser(MOCK_TOKEN)).thenReturn(mockUserDto);
        when(orderRepository.findByIdAndUserId(orderId, MOCK_USER_ID)).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class, () -> {
            orderService.getOrderById(orderId, MOCK_EMAIL, MOCK_TOKEN);
        });
        
        verify(orderRepository, times(1)).findByIdAndUserId(orderId, MOCK_USER_ID);
    }
}