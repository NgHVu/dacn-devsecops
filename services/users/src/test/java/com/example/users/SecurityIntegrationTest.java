package com.example.users;

import com.example.users.dto.UserResponse;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.Collection;
import java.util.List;
import static org.mockito.Mockito.doReturn;
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

    @MockBean
    private UserService userService;

    @MockBean
    private JavaMailSender javaMailSender;

    private UserDetails mockSpringUserDetails;
    private UserResponse mockUserResponse;


    @BeforeEach
    void setUp() {
        mockSpringUserDetails = new org.springframework.security.core.userdetails.User("test@example.com", "password", new ArrayList<>());

        mockUserResponse = new UserResponse(
            1L, 
            "Test User", 
            "test@example.com", 
            "ROLE_USER",
            null, 
            null,
            null,
            true  
        );
    }

    private String generateTestToken(String email, String role) {
        Authentication mockAuthentication = Mockito.mock(Authentication.class);
        when(mockAuthentication.getName()).thenReturn(email);
        Collection<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));
        doReturn(authorities).when(mockAuthentication).getAuthorities();
        
        return tokenProvider.generateToken(mockAuthentication);
    }

    @Test
    @DisplayName("Khi truy cập endpoint được bảo vệ không có token, trả về 401 Unauthorized")
    void testAccessProtectedEndpoint_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Yêu cầu xác thực. Vui lòng cung cấp token hợp lệ."));
    }

    @Test
    @DisplayName("Khi truy cập với token hợp lệ, trả về 200 OK và thông tin user")
    void testAccessProtectedEndpoint_WithValidToken_ShouldReturnOk() throws Exception {
        
        String validToken = generateTestToken("test@example.com", "ROLE_USER");

        when(userService.loadUserByUsername("test@example.com")).thenReturn(mockSpringUserDetails);
        when(userService.getCurrentUser()).thenReturn(mockUserResponse);


        mockMvc.perform(get("/api/users/me")
                            .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
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
        
        String validToken = generateTestToken("test@example.com", "ROLE_USER");

        mockMvc.perform(get("/api/users/me")
                            .header("Authorization", validToken)) 
                .andExpect(status().isUnauthorized());
    }
}