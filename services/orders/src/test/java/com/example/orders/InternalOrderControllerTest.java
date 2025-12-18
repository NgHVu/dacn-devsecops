package com.example.orders;

import com.example.orders.controller.InternalOrderController;
import com.example.orders.entity.Order;
import com.example.orders.entity.OrderStatus;
import com.example.orders.repository.OrderRepository;
import com.example.orders.security.JwtAuthenticationEntryPoint;
import com.example.orders.security.JwtAuthenticationFilter;
import com.example.orders.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalOrderController.class)
@AutoConfigureMockMvc(addFilters = false) // Tắt filters để tập trung test logic
@DisplayName("InternalOrderController Unit Tests")
class InternalOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderRepository orderRepository;

    // --- MOCK CÁC BEAN BẢO MẬT BẮT BUỘC ĐỂ LOAD CONTEXT THÀNH CÔNG ---
    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter; 

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext; 
    // ----------------------------------------------------

    @Test
    @DisplayName("getOrderStatus: Trả về 200 và tên Status khi tìm thấy đơn hàng")
    @WithMockUser 
    void getOrderStatus_Success() throws Exception {
        // Given
        Long orderId = 1L;
        Order mockOrder = new Order();
        mockOrder.setId(orderId);
        mockOrder.setStatus(OrderStatus.DELIVERED);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

        // When & Then
        mockMvc.perform(get("/api/internal/orders/{id}/status", orderId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("DELIVERED"));
    }

    @Test
    @DisplayName("getOrderStatus: Trả về 404 khi không tìm thấy đơn hàng")
    @WithMockUser
    void getOrderStatus_NotFound() throws Exception {
        // Given
        Long orderId = 99L;
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        // When & Then
        // Sau khi đã cập nhật Controller và ExceptionHandler, 
        // MockMvc sẽ nhận diện đúng lỗi 404 từ GlobalExceptionHandler.
        mockMvc.perform(get("/api/internal/orders/{id}/status", orderId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}