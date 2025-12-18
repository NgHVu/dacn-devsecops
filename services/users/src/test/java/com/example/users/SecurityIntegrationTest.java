package com.example.users;

import com.example.users.dto.UserResponse;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.EmailService;
import com.example.users.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Security Layer Integration Tests")
// Sử dụng DirtiesContext để buộc reload Context sau mỗi test method, tránh rò rỉ SecurityContext
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@TestPropertySource(properties = {
    "app.jwt.secret-key=bXktc2VjcmV0LWtleS1mb3ItZGV2c2Vjb3BzLXRlc3RpbmctcHVycG9zZXMtYmV5b25kLXNhbXBsZQ==",
    "app.jwt.expiration-ms=3600000",
    "spring.mail.username=test-user",
    "app.frontend.url=http://localhost:3000",
    "app.oauth.google.redirect-uri=http://localhost/callback"
})
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @MockBean
    private UserService userService;

    @MockBean
    private EmailService emailService;

    @MockBean
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

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
        String email = "test@example.com";
        String role = "ROLE_USER";

        UserDetails mockUserDetails = new User(email, "password", 
                Collections.singletonList(new SimpleGrantedAuthority(role)));
        
        when(userService.loadUserByUsername(email)).thenReturn(mockUserDetails);

        UserResponse mockResponse = new UserResponse(
            1L, "Test User", email, role, null, null, null, true
        );
        when(userService.getCurrentUser()).thenReturn(mockResponse);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                email, null, mockUserDetails.getAuthorities());
        String token = tokenProvider.generateToken(auth);

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value(role));
    }

    @Test
    @DisplayName("RBAC: User thường truy cập API Admin -> Trả về 403 Forbidden")
    void testAccessAdminEndpoint_AsUser_ShouldReturnForbidden() throws Exception {
        String email = "user@example.com";
        UserDetails mockUserDetails = new User(email, "password", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        
        // Mock service trả về user có quyền USER
        when(userService.loadUserByUsername(email)).thenReturn(mockUserDetails);
        
        // Tạo token tương ứng với user có quyền USER
        String token = tokenProvider.generateToken(new UsernamePasswordAuthenticationToken(email, null, mockUserDetails.getAuthorities()));

        mockMvc.perform(patch("/api/users/1/lock")
                .param("locked", "true")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC: Admin truy cập API Admin -> Trả về 200 OK")
    void testAccessAdminEndpoint_AsAdmin_ShouldReturnOk() throws Exception {
        String email = "admin@example.com";
        UserDetails mockUserDetails = new User(email, "password", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        
        // Mock service trả về user có quyền ADMIN
        when(userService.loadUserByUsername(email)).thenReturn(mockUserDetails);
        
        // Tạo token tương ứng với user có quyền ADMIN
        String token = tokenProvider.generateToken(new UsernamePasswordAuthenticationToken(email, null, mockUserDetails.getAuthorities()));

        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
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
        String email = "test@example.com";
        UserDetails mockUserDetails = new User(email, "password", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        String token = tokenProvider.generateToken(new UsernamePasswordAuthenticationToken(email, null, mockUserDetails.getAuthorities()));

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", token))
                .andExpect(status().isUnauthorized());
    }
}