package com.example.users;

import com.example.users.controller.AuthController;
import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.security.JwtAuthenticationFilter; // THÊM IMPORT
import com.example.users.security.JwtTokenProvider; // THÊM IMPORT
import com.example.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@DisplayName("AuthController Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @SuppressWarnings("removal")
        @MockBean
    private UserService userService;

    // =========================================================
    // SỬA LỖI: Thêm các MockBean cho các thành phần bảo mật
    // mà @WebMvcTest không tự động tải
    // =========================================================
    @SuppressWarnings("removal")
        @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @SuppressWarnings("removal")
        @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;


    // === Test cho /api/auth/register ===

    @Test
    @DisplayName("POST /register: Thành công khi dữ liệu hợp lệ")
    void testRegisterUser_Success() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        UserResponse response = new UserResponse(1L, "Test User", "test@example.com");

        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        verify(userService).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /register: Thất bại (400) khi input không hợp lệ (email rỗng)")
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

    // === Test cho /api/auth/login ===

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
    @DisplayName("POST /login: Thất bại (401) khi thông tin đăng nhập sai")
    void testLoginUser_InvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");

        when(userService.loginUser(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Thông tin đăng nhập không chính xác"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
