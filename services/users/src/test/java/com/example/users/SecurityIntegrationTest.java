package com.example.users;

import com.example.users.dto.UserResponse;
import com.example.users.entity.User;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mail.javamail.JavaMailSender;
import java.util.ArrayList;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Security Layer Integration Tests")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @SuppressWarnings("removal")
    @MockBean
    private UserService userService;

    @MockBean
    private JavaMailSender javaMailSender;

    private UserDetails mockSpringUserDetails;
    private UserResponse mockUserResponse;
    // Thêm đối tượng User entity mẫu
    private User mockUserEntity;


    @BeforeEach
    void setUp() {
        // Chuẩn bị User entity mẫu (để truyền vào generateToken)
        mockUserEntity = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .build();

        // Dùng tên đầy đủ để tránh xung đột
        // Chuẩn bị UserDetails mẫu (của Spring Security)
        mockSpringUserDetails = new org.springframework.security.core.userdetails.User("test@example.com", "password", new ArrayList<>());
        // Chuẩn bị UserResponse mẫu
        mockUserResponse = new UserResponse(1L, "Test User", "test@example.com");
    }

    // TEST CHO JwtAuthenticationEntryPoint

    @Test
    @DisplayName("Khi truy cập endpoint được bảo vệ không có token, trả về 401 Unauthorized")
    void testAccessProtectedEndpoint_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Yêu cầu xác thực. Vui lòng cung cấp token hợp lệ."));
    }

    // TESTS CHO JwtAuthenticationFilter

    @Test
    @DisplayName("Khi truy cập với token hợp lệ, trả về 200 OK và thông tin user")
    void testAccessProtectedEndpoint_WithValidToken_ShouldReturnOk() throws Exception {
        // Một token JWT hợp lệ được tạo từ User entity
        // Truyền vào đối tượng entity User
        String validToken = tokenProvider.generateToken(mockUserEntity);

        // Giả lập UserService
        when(userService.loadUserByUsername("test@example.com")).thenReturn(mockSpringUserDetails);
        when(userService.getCurrentUser()).thenReturn(mockUserResponse);


        // Thực hiện request với header "Authorization" chứa token
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + validToken))
                // Mong đợi status 200 OK và nội dung response chính xác
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Test User"));
    }

    @Test
    @DisplayName("Khi truy cập với token không hợp lệ (sai chữ ký), trả về 401 Unauthorized")
    void testAccessProtectedEndpoint_WithInvalidSignatureToken_ShouldReturnUnauthorized() throws Exception {
        String invalidToken = "this.is.an-invalid-token";

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Khi truy cập với header Authorization không có 'Bearer ', trả về 401 Unauthorized")
    void testAccessProtectedEndpoint_WithoutBearerPrefix_ShouldReturnUnauthorized() throws Exception {
        // Một token hợp lệ được tạo từ User entity
        // Truyền vào đối tượng entity User
        String validToken = tokenProvider.generateToken(mockUserEntity);

        // Thực hiện request thiếu "Bearer "
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", validToken)) // Thiếu "Bearer "
                .andExpect(status().isUnauthorized());
    }
}

