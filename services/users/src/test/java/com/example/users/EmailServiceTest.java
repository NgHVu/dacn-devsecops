package com.example.users;

import com.example.users.dto.SendOrderEmailRequest;
import com.example.users.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Email Service Unit Tests")
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private SpringTemplateEngine templateEngine;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "senderEmail", "noreply@foodapp.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:3000");
    }

    @Test
    @DisplayName("sendOtpEmail: Gửi mail OTP thành công")
    void testSendOtpEmail_Success() {
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        emailService.sendOtpEmail("test@example.com", "123456");

        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("sendPasswordResetEmail: Gửi mail reset mật khẩu thành công")
    void testSendPasswordResetEmail_Success() throws Exception {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendPasswordResetEmail("test@example.com", "token123");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendOrderNotification: Bỏ qua khi trạng thái là CONFIRMED")
    void testSendOrderNotification_SkipConfirmed() {
        SendOrderEmailRequest request = new SendOrderEmailRequest(100L, 1L, "CONFIRMED", null, new ArrayList<>());
        
        emailService.sendOrderNotification("test@example.com", "User", request);

        verifyNoInteractions(mailSender);
    }

    @Test
    @DisplayName("sendOrderNotification: Gửi mail khi trạng thái là PENDING")
    void testSendOrderNotification_Success_Pending() throws Exception {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("order-confirmation"), any())).thenReturn("html-content");

        SendOrderEmailRequest request = new SendOrderEmailRequest(100L, 1L, "PENDING", null, new ArrayList<>());
        
        emailService.sendOrderNotification("test@example.com", "User", request);

        verify(mailSender).send(any(MimeMessage.class));
    }
}