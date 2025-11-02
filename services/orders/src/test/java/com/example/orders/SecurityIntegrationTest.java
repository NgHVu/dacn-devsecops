package com.example.orders;

import com.example.orders.service.OrderService;
import com.example.orders.security.JwtTokenProvider; // Import JwtTokenProvider thật
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration Test cho tầng Security (Security Layer).
 * Sử dụng @SpringBootTest để tải toàn bộ ApplicationContext,
 * bao gồm cả SecurityConfig, Filter, và EntryPoint.
 * Chúng ta sẽ Mock OrderService để chỉ tập trung test luồng bảo mật.
 */
@SpringBootTest
@AutoConfigureMockMvc // Tự động cấu hình MockMvc
@DisplayName("Security Layer Integration Tests")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider; // Inject JwtTokenProvider THẬT

    @MockBean
    private OrderService orderService; // Giả lập (Mock) Service

    // === Test cho JwtAuthenticationEntryPoint ===
    // (Kiểm tra kịch bản lỗi 401 khi chưa xác thực)

    @Test
    @DisplayName("GET /api/v1/orders/my: Thất bại (401) khi không có Token")
    void testAccessProtectedEndpoint_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        // Act & Assert
        // Thực hiện request đến endpoint được bảo vệ mà không có header Authorization
        mockMvc.perform(get("/api/v1/orders/my"))
                // Mong đợi status 401 Unauthorized
                .andExpect(status().isUnauthorized())
                // Mong đợi JSON trả về từ JwtAuthenticationEntryPoint
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Yêu cầu xác thực. Vui lòng cung cấp token hợp lệ."));
    }

    // === Tests cho JwtAuthenticationFilter ===

    @Test
    @DisplayName("GET /api/v1/orders/my: Thất bại (401) khi Token sai định dạng")
    void testAccessProtectedEndpoint_WithMalformedToken_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        String malformedToken = "Bearer 123.abc.xyz"; // Token sai định dạng

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my")
                .header("Authorization", malformedToken))
                // Mong đợi status 401 (do JwtAuthenticationFilter ném lỗi -> EntryPoint bắt)
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/orders/my: Thất bại (401) khi không có tiền tố 'Bearer'")
    void testAccessProtectedEndpoint_WithoutBearerPrefix_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        // (Tạo 1 token thật)
        Authentication mockAuth = new UsernamePasswordAuthenticationToken("test@example.com", null, Collections.emptyList());
        String validToken = jwtTokenProvider.generateToken(mockAuth);

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my")
                .header("Authorization", validToken)) // Gửi token mà không có "Bearer "
                // Mong đợi status 401 (do getJwtFromRequest trả về null)
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/orders/my: Thành công (200 OK) khi Token hợp lệ")
    void testAccessProtectedEndpoint_WithValidToken_ShouldReturnOk() throws Exception {
        // Arrange
        // 1. Tạo 1 token thật
        String testEmail = "valid.user@example.com";
        Authentication mockAuth = new UsernamePasswordAuthenticationToken(testEmail, null, Collections.emptyList());
        String validToken = jwtTokenProvider.generateToken(mockAuth);
        String fullBearerToken = "Bearer " + validToken;

        // 2. Giả lập hành vi của OrderService (vì nó sẽ được gọi sau khi filter thành công)
        // Khi orderService.getOrders được gọi với đúng email, token, và pageable
        // thì trả về một Page rỗng.
        when(orderService.getOrders(eq(testEmail), eq(fullBearerToken), any(Pageable.class)))
                .thenReturn(Page.empty());

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my") // Gọi đến /my (dùng Pageable mặc định)
                .header("Authorization", fullBearerToken)) // Gửi token thật
                // Mong đợi status 200 OK
                .andExpect(status().isOk())
                // Mong đợi một JSON rỗng (vì mock trả về Page.empty())
                .andExpect(jsonPath("$.content").isEmpty());
    }
}