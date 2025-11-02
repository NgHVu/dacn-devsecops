package com.example.orders;

import com.example.orders.service.OrderService;
import com.example.orders.security.JwtTokenProvider; 
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
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
 * Dùng @SpringBootTest để "chạy thật" toàn bộ ApplicationContext.
 */
@SpringBootTest
@AutoConfigureMockMvc 
@EnableJpaRepositories(basePackages = "com.example.orders.repository") // Load Repositories
@EntityScan(basePackages = "com.example.orders.entity") // Load Entities
@DisplayName("Security Layer Integration Tests")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc; 

    @Autowired
    private JwtTokenProvider jwtTokenProvider; // Inject JwtTokenProvider THẬT

    @MockBean
    private OrderService orderService; // Giả lập (Mock) Service

    // === Test cho JwtAuthenticationEntryPoint ===

    @Test
    @DisplayName("GET /api/v1/orders/my: Thất bại (401) khi không có Token")
    void testAccessProtectedEndpoint_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                // SỬA LỖI ASSERTION: Mong đợi message thật từ exception,
                // không phải message hardcoded.
                .andExpect(jsonPath("$.message").value("Full authentication is required to access this resource"));
    }

    // === Tests cho JwtAuthenticationFilter ===

    @Test
    @DisplayName("GET /api/v1/orders/my: Thất bại (401) khi Token sai định dạng")
    void testAccessProtectedEndpoint_WithMalformedToken_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        String malformedToken = "Bearer 123.abc.xyz";

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my")
                .header("Authorization", malformedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/orders/my: Thất bại (401) khi không có tiền tố 'Bearer '")
    void testAccessProtectedEndpoint_WithoutBearerPrefix_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        Authentication mockAuth = new UsernamePasswordAuthenticationToken("test@example.com", null, Collections.emptyList());
        String validToken = jwtTokenProvider.generateToken(mockAuth);

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my")
                .header("Authorization", validToken)) // Không có "Bearer "
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/orders/my: Thành công (200 OK) khi Token hợp lệ")
    void testAccessProtectedEndpoint_WithValidToken_ShouldReturnOk() throws Exception {
        // Arrange
        String testEmail = "valid.user@example.com";
        Authentication mockAuth = new UsernamePasswordAuthenticationToken(testEmail, null, Collections.emptyList());
        String validToken = jwtTokenProvider.generateToken(mockAuth);
        String fullBearerToken = "Bearer " + validToken;

        // Giả lập hành vi của OrderService
        when(orderService.getOrders(eq(testEmail), eq(fullBearerToken), any(Pageable.class)))
                .thenReturn(Page.empty());

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/my")
                .header("Authorization", fullBearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }
}

