package com.example.users;

import com.example.users.controller.AuthController;
import com.example.users.dto.*;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.security.JwtAuthenticationEntryPoint;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.EmailService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@DisplayName("AuthController Coverage Plus Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean 
    private EmailService emailService; 

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    // --- 1. REGISTER & VERIFY ---

    @Test
    @DisplayName("POST /register: Success")
    void testRegisterUser_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        doNothing().when(userService).registerUser(any(RegisterRequest.class));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().string("Đã gửi OTP đến email. Vui lòng xác thực."));
    }

    @Test
    @DisplayName("POST /register: Conflict when email exists")
    void testRegisterUser_Conflict() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        doThrow(new EmailAlreadyExistsException("Email exists")).when(userService).registerUser(any());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /verify: Success")
    void testVerifyAccount_Success() throws Exception {
        VerifyRequest request = new VerifyRequest("test@example.com", "123456");
        when(userService.verifyAccount(any())).thenReturn(new AuthResponse("token"));

        mockMvc.perform(post("/api/auth/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("token"));
    }

    // --- 2. LOGIN & OAUTH ---

    @Test
    @DisplayName("POST /login: Success")
    void testLoginUser_Success() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password");
        when(userService.loginUser(any())).thenReturn(new AuthResponse("token"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /oauth/google: Success")
    void testGoogleLogin_Success() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest("google-code");
        when(userService.loginWithGoogle("google-code")).thenReturn(new AuthResponse("google-token"));

        mockMvc.perform(post("/api/auth/oauth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("google-token"));
    }

    // --- 3. OTP & PASSWORD RECOVERY ---

    @Test
    @DisplayName("POST /resend-otp: Success")
    void testResendOtp_Success() throws Exception {
        ResendOtpRequest request = new ResendOtpRequest("test@example.com");
        doNothing().when(userService).resendOtp("test@example.com");

        mockMvc.perform(post("/api/auth/resend-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã gửi lại mã OTP. Vui lòng kiểm tra email."));
    }

    @Test
    @DisplayName("POST /forgot-password: Success")
    void testForgotPassword_Success() throws Exception {
        EmailRequest request = new EmailRequest("test@example.com");
        doNothing().when(userService).processForgotPassword("test@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Chúng tôi đã gửi cách lấy lại mật khẩu cho bạn."));
    }

    @Test
    @DisplayName("GET /validate-reset-token: Success")
    void testValidateResetToken_Success() throws Exception {
        doNothing().when(userService).validateResetToken("valid-token");

        mockMvc.perform(get("/api/auth/validate-reset-token")
                .param("token", "valid-token"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /reset-password: Success")
    void testResetPassword_Success() throws Exception {
        // FIX: Sử dụng mật khẩu dài hơn để thỏa mãn validation tối thiểu (nếu có)
        ResetPasswordRequest request = new ResetPasswordRequest("token", "newPassword123");
        doNothing().when(userService).resetPassword("token", "newPassword123");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Mật khẩu của bạn đã được cập nhật thành công."));
    }

    // --- 4. ERROR HANDLING MAPPING ---

    @Test
    @DisplayName("POST /login: Should return 400 when BadCredentials")
    void testLoginUser_BadCredentials() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrong");
        when(userService.loginUser(any())).thenThrow(new BadCredentialsException("Invalid"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}