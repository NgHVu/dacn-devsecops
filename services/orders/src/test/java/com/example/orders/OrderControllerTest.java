package com.example.orders;

import com.example.orders.controller.OrderController;
import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderItemRequest;
import com.example.orders.dto.OrderResponse;
import com.example.orders.dto.OrderItemResponse;
import com.example.orders.exception.OrderNotFoundException;
import com.example.orders.security.JwtAuthenticationEntryPoint;
import com.example.orders.security.JwtTokenProvider;
import com.example.orders.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = OrderController.class,
    excludeAutoConfiguration = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        JpaRepositoriesAutoConfiguration.class,
    }
)
@DisplayName("OrderController Tests")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc; // Dùng để giả lập các request HTTP

    @Autowired
    private ObjectMapper objectMapper; // Dùng để chuyển đổi DTO sang JSON

    // --- Giả lập các Bean phụ thuộc ---
    @MockBean
    private OrderService orderService; // Mock "bộ não" service

    // Cần mock các bean này để SecurityConfig của @WebMvcTest có thể khởi động
    @MockBean
    private JwtTokenProvider jwtTokenProvider;
    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    // --- Dữ liệu mẫu ---
    private final String MOCK_EMAIL = "test.user@example.com";
    private final String MOCK_TOKEN = "Bearer dummy.token.123";

    // === Test cho POST /api/v1/orders (Tạo đơn hàng) ===

    @Test
    @DisplayName("POST /orders: Thành công (201 Created) khi đã xác thực và DTO hợp lệ")
    @WithMockUser // Giả lập user đã đăng nhập (vượt qua tầng security)
    void testCreateOrder_Success() throws Exception {
        // Arrange
        OrderItemRequest itemRequest = new OrderItemRequest(101L, 2);
        OrderCreateRequest createRequest = new OrderCreateRequest(List.of(itemRequest));

        OrderResponse responseDto = new OrderResponse(
                1L, 1L, "PENDING", new BigDecimal("100.00"),
                List.of(new OrderItemResponse(1L, 101L, "Sản phẩm 1", 2, new BigDecimal("50.00"))),
                LocalDateTime.now(), LocalDateTime.now()
        );

        // Giả lập service: khi được gọi với bất kỳ DTO và token nào, trả về responseDto
        when(orderService.createOrder(any(OrderCreateRequest.class), eq(MOCK_TOKEN)))
                .thenReturn(responseDto);

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .header("Authorization", MOCK_TOKEN) // Manually add header (vì controller cần)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated()) // Mong đợi 201 Created
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.items[0].productName").value("Sản phẩm 1"));
        
        // Kiểm tra xem service đã được gọi đúng 1 lần
        verify(orderService, times(1)).createOrder(any(OrderCreateRequest.class), eq(MOCK_TOKEN));
    }

    @Test
    @DisplayName("POST /orders: Thất bại (400 Bad Request) khi DTO không hợp lệ")
    @WithMockUser // Phải đăng nhập để qua cửa security
    void testCreateOrder_InvalidInput_ShouldReturnBadRequest() throws Exception {
        // Arrange
        OrderCreateRequest badRequest = new OrderCreateRequest(List.of()); // Gửi danh sách rỗng (vi phạm @NotEmpty)

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .header("Authorization", MOCK_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest()); // Mong đợi 400 Bad Request

        // Đảm bảo service KHÔNG BAO GIỜ được gọi nếu validation thất bại
        verify(orderService, never()).createOrder(any(), any());
    }

    // === Test cho GET /api/v1/orders/my (Lấy lịch sử) ===

    @Test
    @DisplayName("GET /orders/my: Thành công (200 OK) khi đã xác thực")
    @WithMockUser(username = MOCK_EMAIL) // Giả lập user đã đăng nhập với email
    void testGetMyOrders_Success() throws Exception {
        // Arrange
        // (Tạo một Page rỗng để trả về)
        Page<OrderResponse> mockPage = Page.empty();

        // Giả lập service
        when(orderService.getOrders(eq(MOCK_EMAIL), eq(MOCK_TOKEN), any(Pageable.class)))
                .thenReturn(mockPage);

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my")
                .header("Authorization", MOCK_TOKEN) // Controller cần header này
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray()) // Kiểm tra response là một Page
                .andExpect(jsonPath("$.empty").value(true));

        verify(orderService, times(1)).getOrders(eq(MOCK_EMAIL), eq(MOCK_TOKEN), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /orders/my: Thất bại (401 Unauthorized) khi chưa xác thực")
    void testGetMyOrders_Unauthorized() throws Exception {
        // Act & Assert
        // KHÔNG dùng @WithMockUser
        mockMvc.perform(get("/api/v1/orders/my"))
                .andExpect(status().isUnauthorized()); // Mong đợi 401

        verify(orderService, never()).getOrders(any(), any(), any());
    }
    
    // === Test cho GET /api/v1/orders/{orderId} (Lấy chi tiết) ===
    
    @Test
    @DisplayName("GET /orders/{orderId}: Thất bại (404 Not Found) khi đơn hàng không tồn tại")
    @WithMockUser(username = MOCK_EMAIL)
    void testGetOrderById_NotFound() throws Exception {
        // Arrange
        Long orderId = 99L;
        // Giả lập service ném ra lỗi OrderNotFoundException
        when(orderService.getOrderById(eq(orderId), eq(MOCK_EMAIL), eq(MOCK_TOKEN)))
                .thenThrow(new OrderNotFoundException("Không tìm thấy đơn hàng"));

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/{orderId}", orderId)
                .header("Authorization", MOCK_TOKEN))
                .andExpect(status().isNotFound()); // Mong đợi 404
    }
}

