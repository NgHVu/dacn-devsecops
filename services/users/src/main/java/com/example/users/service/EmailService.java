package com.example.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("nhoangvu2306@gmail.com"); // (hoặc email của bạn)
            message.setTo(toEmail);
            message.setSubject("Mã Xác Thực OTP cho FoodApp");
            message.setText("Mã OTP của bạn là: " + otp + "\n\n" +
                            "Mã này sẽ hết hạn sau 10 phút.");
            
            mailSender.send(message);
        } catch (Exception e) {
            // (Trong thực tế, bạn nên xử lý lỗi này kỹ hơn, ví dụ: dùng queue)
            throw new RuntimeException("Không thể gửi email OTP", e);
        }
    }
}