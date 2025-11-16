package com.example.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async; 
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j 
public class EmailService {

    private final JavaMailSender mailSender;

    @Async 
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Đang chuẩn bị gửi OTP đến {}...", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("nhoangvu2306@gmail.com"); 
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
}