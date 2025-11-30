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
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OrderController.class)
@DisplayName("OrderController Tests")
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

    @Test
    @DisplayName("POST /orders: Thành công (201 Created) khi đã xác thực và DTO hợp lệ")
    @WithMockUser
    void testCreateOrder_Success() throws Exception {
        // [FIX] Cập nhật constructor OrderItemRequest (3 tham số: id, quantity, note)
        OrderItemRequest itemRequest = new OrderItemRequest(101L, 2, "Ít đá");
        
        // [FIX] Cập nhật constructor OrderCreateRequest (6 tham số: customerName, address, phone, note, paymentMethod, items)
        OrderCreateRequest createRequest = new OrderCreateRequest(
                "Nguyễn Văn Test",
                "123 Đường Testing, Quận Test",
                "0909123456",
                "Giao nhanh nhé",
                "COD",
                List.of(itemRequest)
        );

        OrderResponse responseDto = new OrderResponse(
                1L, 
                1L, 
                "PENDING", 
                new BigDecimal("100.00"),
                List.of(new OrderItemResponse(1L, 101L, "Sản phẩm 1", 2, new BigDecimal("50.00"))),
                OffsetDateTime.now(), 
                OffsetDateTime.now()  
        );

        // Mock hành vi của Service
        when(orderService.createOrder(any(OrderCreateRequest.class), eq(MOCK_TOKEN)))
                .thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", MOCK_TOKEN)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalAmount").value(100.00));
    }

    @Test
    @DisplayName("POST /orders: Thất bại (400 Bad Request) khi DTO không hợp lệ")
    @WithMockUser
    void testCreateOrder_InvalidInput_ShouldReturnBadRequest() throws Exception {
        // [FIX] Tạo request không hợp lệ (Ví dụ: List items rỗng, tên rỗng)
        // Các tham số rỗng sẽ kích hoạt @NotBlank, list rỗng kích hoạt @NotEmpty
        OrderCreateRequest badRequest = new OrderCreateRequest(
                "", // Tên rỗng -> Lỗi
                "", 
                "", 
                "", 
                "COD", 
                List.of() // Items rỗng -> Lỗi
        );

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", MOCK_TOKEN)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest());

        verify(orderService, never()).createOrder(any(), any());
    }

    @Test
    @DisplayName("GET /orders/my: Thành công (200 OK) khi đã xác thực")
    @WithMockUser(username = MOCK_EMAIL)
    void testGetMyOrders_Success() throws Exception {
        Page<OrderResponse> mockPage = Page.empty();

        when(orderService.getOrders(eq(MOCK_EMAIL), eq(MOCK_TOKEN), any(Pageable.class)))
                .thenReturn(mockPage);

        mockMvc.perform(get("/api/v1/orders/my")
                        .header("Authorization", MOCK_TOKEN)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.empty").value(true));
    }

    @Test
    @DisplayName("GET /orders/my: Thất bại (401 Unauthorized) khi chưa xác thực")
    void testGetMyOrders_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/orders/my"))
                .andExpect(status().isUnauthorized());

        verify(orderService, never()).getOrders(any(), any(), any());
    }
    
    @Test
    @DisplayName("GET /orders/{orderId}: Thất bại (404 Not Found) khi đơn hàng không tồn tại")
    @WithMockUser(username = MOCK_EMAIL)
    void testGetOrderById_NotFound() throws Exception {
        Long orderId = 99L;
        
        when(orderService.getOrderById(orderId, MOCK_EMAIL, MOCK_TOKEN))
                .thenThrow(new OrderNotFoundException("Không tìm thấy đơn hàng"));

        mockMvc.perform(get("/api/v1/orders/{orderId}", orderId)
                        .header("Authorization", MOCK_TOKEN))
                .andExpect(status().isNotFound());
    }
}