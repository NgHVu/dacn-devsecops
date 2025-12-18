package com.example.users;

import com.example.users.dto.UserResponse;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.EmailService;
import com.example.users.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Security Layer Integration Tests")
@TestPropertySource(properties = {
    // Cấu hình JWT thật để test logic generate/validate
    "app.jwt.secret-key=bXktc2VjcmV0LWtleS1mb3ItZGV2c2Vjb3BzLXRlc3RpbmctcHVycG9zZXMtYmV5b25kLXNhbXBsZQ==", // > 256 bits
    "app.jwt.expiration-ms=3600000",
    
    // Các giá trị giả (Dummy) để thỏa mãn @Value trong các Bean khác nếu chúng vô tình được khởi tạo
    "spring.mail.username=test-user",
    "app.frontend.url=http://localhost:3000",
    "app.oauth.google.redirect-uri=http://localhost/callback"
})
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider; // Sử dụng Bean thật để test integration

    // --- MOCK CÁC DEPENDENCY ĐỂ TRÁNH LỖI CONTEXT LOAD ---
    
    @MockBean
    private UserService userService;

    // Mock EmailService & UserRepository để InternalEmailController khởi tạo được mà không lỗi
    @MockBean
    private EmailService emailService;

    @MockBean
    private UserRepository userRepository;

    // -----------------------------------------------------

    @Test
    @DisplayName("Khi truy cập endpoint bảo vệ mà KHÔNG có token -> Trả về 401 Unauthorized")
    void testAccessProtectedEndpoint_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Khi truy cập với Token HỢP LỆ -> Trả về 200 OK và thông tin user")
    void testAccessProtectedEndpoint_WithValidToken_ShouldReturnOk() throws Exception {
        // Given
        String email = "test@example.com";
        String role = "ROLE_USER";

        // 1. Giả lập hành vi của UserService (được gọi bởi JwtAuthenticationFilter)
        // Spring Security UserDetails chuẩn
        UserDetails mockUserDetails = new User(email, "password", 
                Collections.singletonList(new SimpleGrantedAuthority(role)));
        
        when(userService.loadUserByUsername(email)).thenReturn(mockUserDetails);

        // 2. Giả lập hành vi của UserService (được gọi bởi UserController)
        UserResponse mockResponse = new UserResponse(
            1L, "Test User", email, role, null, null, null, true
        );
        when(userService.getCurrentUser()).thenReturn(mockResponse);

        // 3. Tạo Token thật từ Provider (Integration Test điểm này là quan trọng nhất)
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                email, null, mockUserDetails.getAuthorities());
        String token = tokenProvider.generateToken(auth);

        // When & Then
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value(role));
    }

    @Test
    @DisplayName("Khi truy cập với Token SAI CHỮ KÝ -> Trả về 401 Unauthorized")
    void testAccessProtectedEndpoint_WithInvalidSignatureToken_ShouldReturnUnauthorized() throws Exception {
        String invalidToken = "eyJhbGciOiJIUzI1NiJ9.sai.chu.ky";

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Khi truy cập với Header thiếu tiền tố 'Bearer ' -> Trả về 401 Unauthorized")
    void testAccessProtectedEndpoint_WithoutBearerPrefix_ShouldReturnUnauthorized() throws Exception {
        // Tạo token hợp lệ nhưng gửi sai cách
        String email = "test@example.com";
        UserDetails mockUserDetails = new User(email, "password", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        String token = tokenProvider.generateToken(new UsernamePasswordAuthenticationToken(email, null, mockUserDetails.getAuthorities()));

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", token)) // Thiếu "Bearer "
                .andExpect(status().isUnauthorized());
    }
}