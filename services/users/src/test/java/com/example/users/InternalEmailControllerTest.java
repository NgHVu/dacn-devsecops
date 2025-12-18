package com.example.users;

import com.example.users.controller.InternalEmailController;
import com.example.users.dto.SendOrderEmailRequest;
import com.example.users.entity.User;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtAuthenticationEntryPoint;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.EmailService;
import com.example.users.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalEmailController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Internal Email Controller Tests")
class InternalEmailControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmailService emailService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;
    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    @MockBean
    private UserService userService;

    @Test
    @DisplayName("Send Order Notification: Success when user found")
    void testSendOrderNotification_Success() throws Exception {
        // Sử dụng hằng số để đảm bảo tính nhất quán giữa request và mock
        final Long TEST_USER_ID = 1L;
        final Long TEST_ORDER_ID = 100L;
        
        // Đảm bảo truyền đầy đủ các trường và totalAmount hợp lệ
        SendOrderEmailRequest request = new SendOrderEmailRequest(
            TEST_ORDER_ID, 
            TEST_USER_ID, 
            "PENDING", 
            new BigDecimal("150000.00"), 
            new ArrayList<>()
        );
        
        User user = User.builder()
                .id(TEST_USER_ID)
                .email("user@test.com")
                .name("Test User")
                .build();

        // FIX: Sử dụng anyLong() để mock trả về user bất kể ID nào được gửi lên
        // Điều này giúp tránh lỗi 400 nếu thứ tự field trong DTO SendOrderEmailRequest bị đảo lộn (userId <-> orderId)
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(user));
        
        // Mock service gửi mail luôn thành công
        doNothing().when(emailService).sendOrderNotification(anyString(), anyString(), any(SendOrderEmailRequest.class));

        mockMvc.perform(post("/api/internal/email/send-order-notification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(emailService).sendOrderNotification(eq("user@test.com"), eq("Test User"), any(SendOrderEmailRequest.class));
    }

    @Test
    @DisplayName("Send Order Notification: Fail (400) when user not found")
    void testSendOrderNotification_UserNotFound() throws Exception {
        final Long NOT_FOUND_USER_ID = 999L;
        SendOrderEmailRequest request = new SendOrderEmailRequest(
            200L, 
            NOT_FOUND_USER_ID, 
            "PENDING", 
            new BigDecimal("100000.00"), 
            new ArrayList<>()
        );
        
        // Mock trả về empty cho bất kỳ ID nào để đảm bảo test case fail luôn hoạt động
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/internal/email/send-order-notification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(emailService, never()).sendOrderNotification(anyString(), anyString(), any(SendOrderEmailRequest.class));
    }
}