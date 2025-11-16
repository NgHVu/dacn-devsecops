package com.example.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.UnsupportedEncodingException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async; 
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j 
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async 
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Đang chuẩn bị gửi OTP đến {}...", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            
            message.setFrom(senderEmail); 
            
            message.setTo(toEmail);
            message.setSubject("Mã Xác Thực OTP cho FoodApp");
            message.setText("Mã OTP của bạn là: " + otp + "\n\n" +
                            "Mã này sẽ hết hạn sau 3 phút.");
            
            mailSender.send(message);
            log.info("Đã gửi OTP đến {} thành công.", toEmail);
        } catch (Exception e) {
            log.error("Không thể gửi email OTP đến {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String userEmail, String token) {
        log.info("Đang chuẩn bị gửi email reset mật khẩu đến: {}", userEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            String htmlContent = "<h2>Yêu cầu Reset mật khẩu cho FoodApp</h2>"
                    + "<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>"
                    + "<p>Vui lòng nhấn vào link bên dưới để đặt lại mật khẩu:</p>"
                    + "<a href=\"" + resetUrl + "\" style=\"background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;\">Đặt lại mật khẩu</a>"
                    + "<p>Link này sẽ hết hạn sau 15 phút.</p>"
                    + "<p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>";

            helper.setTo(userEmail);
            
            helper.setFrom(senderEmail, "FoodApp"); 
            
            helper.setSubject("Yêu cầu Reset mật khẩu");
            helper.setText(htmlContent, true); 

            mailSender.send(message);
            
            log.info("Đã gửi email reset mật khẩu thành công đến: {}", userEmail);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email reset mật khẩu đến {}: {}", userEmail, e.getMessage());
        }
    }
}