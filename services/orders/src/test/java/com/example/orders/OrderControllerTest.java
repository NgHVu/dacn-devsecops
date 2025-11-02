package com.example.orders;

import com.example.orders.controller.OrderController;
import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderItemRequest;
import com.example.orders.dto.OrderItemResponse;
import com.example.orders.dto.OrderResponse;
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
        JpaRepositoriesAutoConfiguration.class
    }
)
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

    private final String MOCK_EMAIL = "test.user@example.com";
    private final String MOCK_TOKEN = "Bearer dummy.token.123";

    @SuppressWarnings("null")
    @Test
    @DisplayName("POST /orders: Thành công (201 Created) khi đã xác thực và DTO hợp lệ")
    @WithMockUser 
    void testCreateOrder_Success() throws Exception {
        OrderItemRequest itemRequest = new OrderItemRequest(101L, 2);
        OrderCreateRequest createRequest = new OrderCreateRequest(List.of(itemRequest));

        OrderResponse responseDto = new OrderResponse(
                1L, 1L, "PENDING", new BigDecimal("100.00"),
                List.of(new OrderItemResponse(1L, 101L, "Sản phẩm 1", 2, new BigDecimal("50.00"))),
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(orderService.createOrder(any(OrderCreateRequest.class), eq(MOCK_TOKEN)))
                .thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/orders")
                .header("Authorization", MOCK_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.items[0].productName").value("Sản phẩm 1"));
        
        verify(orderService, times(1)).createOrder(any(OrderCreateRequest.class), eq(MOCK_TOKEN));
    }

    @SuppressWarnings("null")
    @Test
    @DisplayName("POST /orders: Thất bại (400 Bad Request) khi DTO không hợp lệ")
    @WithMockUser 
    void testCreateOrder_InvalidInput_ShouldReturnBadRequest() throws Exception {
        OrderCreateRequest badRequest = new OrderCreateRequest(List.of()); 

        mockMvc.perform(post("/api/v1/orders")
                .header("Authorization", MOCK_TOKEN)
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

        verify(orderService, times(1)).getOrders(eq(MOCK_EMAIL), eq(MOCK_TOKEN), any(Pageable.class));
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
        when(orderService.getOrderById(eq(orderId), eq(MOCK_EMAIL), eq(MOCK_TOKEN)))
                .thenThrow(new OrderNotFoundException("Không tìm thấy đơn hàng"));

        mockMvc.perform(get("/api/v1/orders/{orderId}", orderId)
                .header("Authorization", MOCK_TOKEN))
                .andExpect(status().isNotFound());
    }
}