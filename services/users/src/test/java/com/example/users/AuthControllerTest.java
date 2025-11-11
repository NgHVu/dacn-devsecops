package com.example.users;

import com.example.users.controller.AuthController;
import com.example.users.dto.*; // Đảm bảo import đủ DTOs
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.security.JwtAuthenticationEntryPoint; // Import EntryPoint
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
// SỬA ĐỔI 1: Thêm các import cần thiết
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager; // Cần mock cái này nữa
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Chỉ test AuthController và tắt các bộ lọc bảo mật
@WebMvcTest(controllers = AuthController.class)
//@AutoConfigureMockMvc(addFilters = false) 
@DisplayName("AuthController Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Mock các bean mà Controller hoặc SecurityConfig (giả) cần 
    @SuppressWarnings("removal")
@MockBean
    private UserService userService;

    // Mock đầy đủ các bean liên quan đến Security
    @SuppressWarnings("removal")
@MockBean
    private JwtTokenProvider jwtTokenProvider; // Cần cho SecurityConfig

    @SuppressWarnings("removal")
@MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint; // Cần cho SecurityConfig

    @SuppressWarnings("removal")
@MockBean
    private AuthenticationManager authenticationManager; // Cần cho UserService 

    //Định nghĩa cấu hình Security tối thiểu CHỈ DÀNH CHO TEST NÀY
    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
            http
                .csrf(csrf -> csrf.disable()) // Vô hiệu hóa CSRF
                .authorizeHttpRequests(auth -> auth
                    .anyRequest().permitAll() // Cho phép tất cả request
                );
            return http.build();
        }
    }

    // Các bài test

    @Test
    @DisplayName("POST /register: Thành công khi dữ liệu hợp lệ")
    void testRegisterUser_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        
        // === SỬA ĐỐI TƯỢNG RESPONSE MẪU ===
        // Từ UserResponse -> AuthResponse
        AuthResponse response = new AuthResponse("dummy.jwt.token");

        // Giả lập service trả về AuthResponse
        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()) // Vẫn là 201 Created
                // === SỬA ASSERTION: Kiểm tra accessToken ===
                .andExpect(jsonPath("$.accessToken").value("dummy.jwt.token"));
    }

    @Test
    @DisplayName("POST /register: Thất bại (400) khi input không hợp lệ")
    void testRegisterUser_InvalidInput_ShouldReturnBadRequest() throws Exception {
        RegisterRequest badRequest = new RegisterRequest("Test User", "", "password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).registerUser(any());
    }

    @Test
    @DisplayName("POST /register: Thất bại (409) khi email đã tồn tại")
    void testRegisterUser_EmailAlreadyExists_ShouldReturnConflict() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new EmailAlreadyExistsException("Email đã tồn tại"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /login: Thành công khi thông tin đăng nhập chính xác")
    void testLoginUser_Success() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        AuthResponse response = new AuthResponse("dummy.jwt.token");
        when(userService.loginUser(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("dummy.jwt.token"));
    }

    @Test
    @DisplayName("POST /login: Thất bại khi thông tin đăng nhập sai")
    void testLoginUser_InvalidCredentials_ShouldFail() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");
        when(userService.loginUser(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Thông tin đăng nhập không chính xác"));

        // Vì không có Security, exception sẽ không được map thành 401.
        // Thay vào đó, nó sẽ gây ra lỗi 403. ()
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}

