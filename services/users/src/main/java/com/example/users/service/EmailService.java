package com.example.users.service;

import com.example.users.dto.SendOrderEmailRequest; 
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Đang chuẩn bị gửi OTP đến {}...", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            
            message.setFrom(String.format("FoodApp <%s>", senderEmail)); 
            
            message.setTo(toEmail);
            message.setSubject("Mã Xác Thực OTP cho FoodApp");
            message.setText("Mã OTP của bạn là: " + otp + "\n\n" +
                            "Mã này sẽ hết hạn sau 3 phút.");
            
            mailSender.send(message);
            log.info("Đã gửi OTP đến {} thành công.", toEmail);
        } catch (MailException e) { 
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
        
        } catch (MessagingException | UnsupportedEncodingException | MailException e) { 
            log.error("Lỗi khi gửi email reset mật khẩu đến {}: {}", userEmail, e.getMessage());
        }
    }

    @Async
    public void sendOrderNotification(String toEmail, String userName, SendOrderEmailRequest request) {
        if ("CONFIRMED".equalsIgnoreCase(request.getStatus())) {
            log.info("Bỏ qua gửi email cho trạng thái CONFIRMED đơn hàng #{}", request.getOrderId());
            return;
        }

        try {
            log.info("Đang chuẩn bị gửi email đơn hàng #{} tới {}", request.getOrderId(), toEmail);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            Context context = new Context();
            context.setVariable("userName", userName);
            context.setVariable("orderId", request.getOrderId());
            context.setVariable("totalAmount", request.getTotalAmount());
            context.setVariable("status", request.getStatus());
            context.setVariable("items", request.getItems());

            String html = "";
            String subject = "Thông báo đơn hàng #" + request.getOrderId(); 

            if ("PENDING".equalsIgnoreCase(request.getStatus())) {
                html = templateEngine.process("order-confirmation", context);
            } else {
                html = templateEngine.process("order-status-update", context);
            }

            helper.setTo(toEmail);
            helper.setFrom(senderEmail, "FoodApp Notifications");
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Đã gửi email HTML đơn hàng #{} thành công!", request.getOrderId());

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email HTML đơn hàng: {}", e.getMessage());
        }
    }
}