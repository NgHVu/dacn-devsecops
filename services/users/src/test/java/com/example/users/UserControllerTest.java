package com.example.users;

import com.example.users.controller.UserController;
import com.example.users.dto.ChangePasswordRequest;
import com.example.users.dto.UpdateProfileRequest;
import com.example.users.dto.UserResponse;
import com.example.users.security.JwtAuthenticationEntryPoint;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false) // Tắt filter bảo mật để tập trung test logic Controller
@DisplayName("User Controller Unit Tests")
class UserControllerTest {

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

    @Test
    @DisplayName("GET /me: Trả về thông tin người dùng hiện tại")
    void testGetCurrentUser_Success() throws Exception {
        UserResponse response = new UserResponse(1L, "User", "user@example.com", "ROLE_USER", null, null, null, true);
        when(userService.getCurrentUser()).thenReturn(response);

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"));
    }

    @Test
    @DisplayName("PATCH /me: Cập nhật thông tin profile thành công")
    void testUpdateProfile_Success() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("New Name", "0123456789", "Hanoi");
        UserResponse response = new UserResponse(1L, "New Name", "user@example.com", "ROLE_USER", "0123456789", "Hanoi", null, true);
        
        when(userService.updateProfile(any(UpdateProfileRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/api/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));
    }

    @Test
    @DisplayName("POST /change-password: Đổi mật khẩu thành công")
    void testChangePassword_Success() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass", "newPass");
        doNothing().when(userService).changePassword(any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/users/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /avatar: Upload ảnh đại diện thành công")
    void testUploadAvatar_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", "some-image".getBytes());
        when(userService.uploadAvatar(any())).thenReturn("/uploads/avatars/avatar.png");

        mockMvc.perform(multipart("/api/users/avatar").file(file))
                .andExpect(status().isOk())
                .andExpect(content().string("/uploads/avatars/avatar.png"));
    }

    @Test
    @DisplayName("GET /: Lấy danh sách toàn bộ user (Admin)")
    void testGetAllUsers_Success() throws Exception {
        Page<UserResponse> page = new PageImpl<>(List.of(
            new UserResponse(1L, "Admin", "admin@example.com", "ROLE_ADMIN", null, null, null, true)
        ));
        when(userService.getAllUsers(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("admin@example.com"));
    }

    @Test
    @DisplayName("PATCH /{id}/lock: Khóa tài khoản thành công")
    void testLockUser_Success() throws Exception {
        doNothing().when(userService).lockUser(eq(1L), eq(true));

        mockMvc.perform(patch("/api/users/1/lock").param("locked", "true"))
                .andExpect(status().isOk());
    }
}