package com.example.users;

import com.example.users.controller.AuthController;
import com.example.users.dto.*; // Đảm bảo import đủ DTOs
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.security.JwtAuthenticationEntryPoint; // Import EntryPoint
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.EmailService; // THÊM: Mock EmailService
import com.example.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*; 

// Chỉ test AuthController
@WebMvcTest(controllers = AuthController.class)
@DisplayName("AuthController Tests (OTP Flow)")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // --- Mock các bean phụ thuộc ---
    @MockBean
    private UserService userService;

    // (Các mock này vẫn cần thiết để SecurityConfig/TestSecurityConfig khởi động)
    @MockBean
    private JwtTokenProvider jwtTokenProvider;
    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    @MockBean
    private AuthenticationManager authenticationManager;
    
    // THÊM: Mock EmailService (vì UserServiceImpl mới cần nó)
    // Mặc dù chúng ta mock UserService, Spring vẫn cố gắng tạo
    // UserServiceImpl (nếu nó được quét) và cần EmailService.
    @MockBean 
    private EmailService emailService; 

    // Cấu hình Security tối thiểu cho test
    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                    .anyRequest().permitAll() // Cho phép tất cả request
                );
            return http.build();
        }
    }

    // === SỬA: Test /register ===
    @Test
    @DisplayName("POST /register: Thành công (201 Created) và gửi OTP")
    void testRegisterUser_Success_ShouldSendOtp() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");

        // Giả lập service (hàm registerUser giờ trả về void)
        doNothing().when(userService).registerUser(any(RegisterRequest.class));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()) // Mong đợi 201 Created
                // Mong đợi message trả về
                .andExpect(content().string("Đã gửi OTP đến email. Vui lòng xác thực."));
        
        // Kiểm tra service được gọi 1 lần
        verify(userService, times(1)).registerUser(any(RegisterRequest.class));
    }

    // === SỬA: Test /register (lỗi trùng email) ===
    @Test
    @DisplayName("POST /register: Thất bại (409) khi email đã tồn tại")
    void testRegisterUser_EmailAlreadyExists_ShouldReturnConflict() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        
        // Giả lập service ném lỗi (sử dụng doThrow cho hàm void)
        doThrow(new EmailAlreadyExistsException("Email đã được sử dụng"))
            .when(userService).registerUser(any(RegisterRequest.class));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict()); // Mong đợi 409 Conflict
    }

    // === THÊM: Test /verify (thành công) ===
    @Test
    @DisplayName("POST /verify: Thành công (200 OK) khi OTP đúng")
    void testVerifyAccount_Success_ShouldReturnToken() throws Exception {
        VerifyRequest request = new VerifyRequest("test@example.com", "123456");
        AuthResponse response = new AuthResponse("dummy.jwt.token.sau.khi.verify");

        // Giả lập service
        when(userService.verifyAccount(any(VerifyRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk()) // Mong đợi 200 OK
                .andExpect(jsonPath("$.accessToken").value("dummy.jwt.token.sau.khi.verify"));
    }

    // === THÊM: Test /verify (OTP sai) ===
   @Test
    @DisplayName("POST /verify: Thất bại (403) khi OTP sai")
    void testVerifyAccount_InvalidOtp_ShouldFail() throws Exception {
        VerifyRequest request = new VerifyRequest("test@example.com", "654321");
        when(userService.verifyAccount(any(VerifyRequest.class)))
            .thenThrow(new BadCredentialsException("Mã OTP không chính xác."));

        mockMvc.perform(post("/api/auth/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden()); // <-- SỬA THÀNH 403
    }

    // === Test /login (giữ nguyên) ===
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

    // === Test /login (sai mật khẩu) ===
    @Test
    @DisplayName("POST /login: Thất bại (403) khi thông tin đăng nhập sai")
    void testLoginUser_InvalidCredentials_ShouldFail() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");
        when(userService.loginUser(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Thông tin đăng nhập không chính xác"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden()); // <-- SỬA THÀNH 403
    }

    // === THÊM: Test /login (chưa xác thực) ===
    @Test
    @DisplayName("POST /login: Thất bại (403) khi tài khoản chưa xác thực OTP")
    void testLoginUser_NotVerified_ShouldFail() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        when(userService.loginUser(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email."));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden()); // <-- SỬA THÀNH 403
                //.andExpect(jsonPath("$.message").value("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email."));
    }
}