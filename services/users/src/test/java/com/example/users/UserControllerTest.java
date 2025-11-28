package com.example.users;

import com.example.users.controller.UserController;
import com.example.users.dto.UserResponse;
import com.example.users.security.JwtAuthenticationEntryPoint; 
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mail.javamail.JavaMailSender; 

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@DisplayName("UserController Tests")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private JavaMailSender javaMailSender;

    @Test
    @DisplayName("GET /me: Thành công (200 OK) khi người dùng đã xác thực")
    @WithMockUser 
    void testGetCurrentUser_Success() throws Exception {
        UserResponse response = new UserResponse(
            1L, 
            "Test User", 
            "test@example.com", 
            "ROLE_USER",
            null,
            null,
            null,
            true
        );
        when(userService.getCurrentUser()).thenReturn(response);

        mockMvc.perform(get("/api/users/me")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"));

        verify(userService).getCurrentUser();
    }

    @Test
    @DisplayName("GET /me: Thất bại (401) khi không có @WithMockUser")
    void testGetCurrentUser_WithoutMockUser_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized()); 
    }
}