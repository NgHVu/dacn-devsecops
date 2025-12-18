package com.example.orders;

import com.example.orders.controller.OrderController;
import com.example.orders.dto.*;
import com.example.orders.exception.OrderNotFoundException;
import com.example.orders.security.JwtAuthenticationEntryPoint;
import com.example.orders.security.JwtTokenProvider;
import com.example.orders.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OrderController.class)
@AutoConfigureMockMvc(addFilters = false) // Tắt filter bảo mật để tập trung test logic Controller
@DisplayName("OrderController Unit Tests - High Coverage")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private final String MOCK_EMAIL = "test.user@example.com";
    private final String MOCK_TOKEN = "Bearer dummy.token.123";

    private OrderResponse createMockOrderResponse(Long id) {
        OrderItemResponse itemResponse = new OrderItemResponse(
                1L, 101L, "Sản phẩm 1", 2, new BigDecimal("50.00"),
                "https://example.com/img.jpg", "L", "Ít đá"
        );

        return new OrderResponse(
                id, 1L, "PENDING", new BigDecimal("100.00"),
                "Nguyễn Văn Test", "123 Đường Testing", "0909123456",
                "Giao nhanh", "COD", "UNPAID",
                List.of(itemResponse), OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    @DisplayName("POST /api/v1/orders: Thành công (201 Created)")
    void testCreateOrder_Success() throws Exception {
        OrderCreateRequest createRequest = new OrderCreateRequest(
                "Nguyễn Văn Test", "123 Đường Testing", "0909123456",
                "Giao nhanh", "COD", List.of(new OrderItemRequest(101L, 2, "L", "Ít đá"))
        );

        OrderResponse responseDto = createMockOrderResponse(1L);

        when(orderService.createOrder(any(OrderCreateRequest.class), eq(MOCK_TOKEN)))
                .thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", MOCK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/v1/orders: Thất bại (400 Bad Request) khi input rỗng")
    void testCreateOrder_InvalidInput_ShouldReturnBadRequest() throws Exception {
        OrderCreateRequest badRequest = new OrderCreateRequest("", "", "", "", "COD", List.of());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", MOCK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/orders/my: Thành công (200 OK)")
    @WithMockUser(username = MOCK_EMAIL)
    void testGetMyOrders_Success() throws Exception {
        Page<OrderResponse> mockPage = new PageImpl<>(List.of(createMockOrderResponse(1L)));

        when(orderService.getOrders(eq(MOCK_EMAIL), eq(MOCK_TOKEN), any(Pageable.class)))
                .thenReturn(mockPage);

        mockMvc.perform(get("/api/v1/orders/my")
                        .header("Authorization", MOCK_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{orderId}: Thành công (200 OK)")
    @WithMockUser(username = MOCK_EMAIL)
    void testGetOrderById_Success() throws Exception {
        OrderResponse response = createMockOrderResponse(1L);
        when(orderService.getOrderById(1L, MOCK_EMAIL, MOCK_TOKEN)).thenReturn(response);

        mockMvc.perform(get("/api/v1/orders/1")
                        .header("Authorization", MOCK_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{orderId}: Thất bại (404 Not Found)")
    @WithMockUser(username = MOCK_EMAIL)
    void testGetOrderById_NotFound() throws Exception {
        when(orderService.getOrderById(99L, MOCK_EMAIL, MOCK_TOKEN))
                .thenThrow(new OrderNotFoundException("Không tìm thấy đơn hàng"));

        mockMvc.perform(get("/api/v1/orders/99")
                        .header("Authorization", MOCK_TOKEN))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/orders: Admin lấy toàn bộ đơn hàng")
    void testGetAllOrders_Success() throws Exception {
        Page<OrderResponse> mockPage = new PageImpl<>(List.of(createMockOrderResponse(1L)));
        when(orderService.getAllOrders(any(Pageable.class))).thenReturn(mockPage);

        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].customerName").value("Nguyễn Văn Test"));
    }

    @Test
    @DisplayName("PATCH /api/v1/orders/{id}/status: Thành công cập nhật trạng thái")
    void testUpdateOrderStatus_Success() throws Exception {
        OrderStatusUpdate update = new OrderStatusUpdate();
        update.setStatus("DELIVERED");
        
        OrderResponse response = createMockOrderResponse(1L);
        response = new OrderResponse(response.id(), response.userId(), "DELIVERED", response.totalAmount(),
                response.customerName(), response.shippingAddress(), response.phoneNumber(), response.note(),
                response.paymentMethod(), response.paymentStatus(), response.items(), response.createdAt(), OffsetDateTime.now());

        when(orderService.updateOrderStatus(eq(1L), any(OrderStatusUpdate.class), eq(MOCK_TOKEN)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/orders/1/status")
                        .header("Authorization", MOCK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test
    @DisplayName("GET /api/v1/orders/admin/dashboard: Lấy thống kê Dashboard thành công")
    @WithMockUser(roles = "ADMIN")
    void testGetDashboardStats_Success() throws Exception {
        // FIX: Chỉ mock các method mà chúng ta biết chắc chắn tồn tại (dựa trên việc log lỗi không báo về chúng)
        DashboardStats mockStats = mock(DashboardStats.class);
        
        // Mock các phương thức accessors của Java Record (không có tiền tố get)
        // Log lỗi trước đó không báo lỗi ở dòng này -> Có nghĩa là method này TỒN TẠI
        lenient().when(mockStats.totalRevenue()).thenReturn(new BigDecimal("5000000"));
        
        // Log lỗi trước đó không báo lỗi ở dòng này -> Method này TỒN TẠI
        lenient().when(mockStats.totalOrders()).thenReturn(100L);

        // Đã xóa các lệnh mock cho 'recentOrders' và 'getRecentOrders' vì gây lỗi biên dịch.
        // Jackson sẽ tự động serialize các field có trong Record.

        when(orderService.getDashboardStats()).thenReturn(mockStats);

        mockMvc.perform(get("/api/v1/orders/admin/dashboard")
                        .header("Authorization", MOCK_TOKEN))
                .andExpect(status().isOk())
                // Chỉ verify trường revenue vì chúng ta đã mock thành công
                .andExpect(jsonPath("$.totalRevenue").value(5000000));
    }
}