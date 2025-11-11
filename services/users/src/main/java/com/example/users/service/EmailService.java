package com.example.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async; // Import Async
import org.springframework.stereotype.Service;

/**
 * Service chuyên xử lý việc gửi email.
 * Tách biệt logic gửi mail ra khỏi UserService.
 */
@Service
@RequiredArgsConstructor
@Slf4j // Thêm Logger
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Gửi email chứa mã OTP.
     * Phương thức này được đánh dấu là @Async để chạy trên một luồng (thread) riêng biệt.
     * Điều này giúp API /register trả về response ngay lập tức mà không cần chờ email gửi xong.
     *
     * @param toEmail Email của người nhận.
     * @param otp Mã OTP (ví dụ: 6 chữ số).
     */
    @Async // <-- TỐI ƯU: Chạy bất đồng bộ
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Đang chuẩn bị gửi OTP đến {}...", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            // (Bạn có thể inject 'spring.mail.username' bằng @Value nếu muốn)
            message.setFrom("nhoangvu2306@gmail.com"); 
            message.setTo(toEmail);
            message.setSubject("Mã Xác Thực OTP cho FoodApp");
            message.setText("Mã OTP của bạn là: " + otp + "\n\n" +
                            "Mã này sẽ hết hạn sau 10 phút.");
            
            mailSender.send(message);
            log.info("Đã gửi OTP đến {} thành công.", toEmail);
        } catch (Exception e) {
            // Lỗi gửi mail không nên làm hỏng luồng đăng ký
            // Log lỗi ở mức ERROR
            log.error("Không thể gửi email OTP đến {}: {}", toEmail, e.getMessage());
            // (Trong thực tế, có thể thêm vào hàng đợi (queue) để thử lại)
            // throw new RuntimeException("Không thể gửi email OTP", e); // Bỏ throw để không làm hỏng /register
        }
    }
}