package com.example.users;

import com.example.users.controller.UserController;
import com.example.users.dto.UserResponse;
import com.example.users.security.JwtAuthenticationEntryPoint;
import com.example.users.security.JwtTokenProvider;
import com.example.users.security.SecurityConfig;
import com.example.users.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@DisplayName("UserController Tests")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @SuppressWarnings("removal")
    @MockBean
    private UserService userService;

    @SuppressWarnings("removal")
    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @SuppressWarnings("removal")
    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;


    @Test
    @DisplayName("GET /me: Thành công (200 OK) khi người dùng đã xác thực")
    @WithMockUser
    void testGetCurrentUser_Success() throws Exception {
        UserResponse response = new UserResponse(1L, "Test User", "test@example.com");
        when(userService.getCurrentUser()).thenReturn(response);

        // SỬA ĐỔI: Thêm header Accept để đảm bảo nhận về JSON
        mockMvc.perform(get("/api/users/me")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        verify(userService).getCurrentUser();
    }

    @Test
    @DisplayName("GET /me: Thất bại (401 Unauthorized) khi chưa xác thực")
    void testGetCurrentUser_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).getCurrentUser();
    }
}
