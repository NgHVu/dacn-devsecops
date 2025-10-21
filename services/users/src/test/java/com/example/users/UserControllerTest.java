package com.example.users;

import com.example.users.controller.UserController;
import com.example.users.dto.UserResponse;
import com.example.users.security.JwtAuthenticationFilter;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 1. Chỉ tải tầng Web, tập trung vào UserController
@WebMvcTest(UserController.class) 
@DisplayName("UserController Tests")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @SuppressWarnings("removal")
    @MockBean
    private UserService userService;

    // 2. TỐI QUAN TRỌNG: @WebMvcTest chỉ tải Controller, nó không tải
    //    SecurityConfig hay các component bảo mật. Chúng ta phải 
    //    @MockBean chúng để Spring không báo lỗi "missing bean".
    @SuppressWarnings("removal")
    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @SuppressWarnings("removal")
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // === Test cho /api/users/me ===

    @Test
    @DisplayName("GET /me: Thành công (200 OK) khi người dùng đã xác thực")
    @WithMockUser // 3. "Ma thuật" là ở đây! Giả lập một người dùng đã đăng nhập.
    void testGetCurrentUser_Success() throws Exception {
        // Arrange
        UserResponse response = new UserResponse(1L, "Test User", "test@example.com");

        // Giả lập service: khi được gọi, trả về response
        when(userService.getCurrentUser()).thenReturn(response);

        // Act & Assert
        mockMvc.perform(get("/api/users/me")) // Không cần gửi token, @WithMockUser đã lo
                .andExpect(status().isOk()) // 200 OK
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        // Đảm bảo service đã được gọi
        verify(userService).getCurrentUser();
    }

    @Test
    @DisplayName("GET /me: Thất bại (401 Unauthorized) khi chưa xác thực")
    void testGetCurrentUser_Unauthorized() throws Exception {
        // Arrange
        // KHÔNG dùng @WithMockUser để giả lập người dùng ẩn danh (chưa đăng nhập)

        // Act & Assert
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized()); // 401 Unauthorized

        // Đảm bảo service KHÔNG BAO GIỜ được gọi
        verify(userService, never()).getCurrentUser();
    }
}