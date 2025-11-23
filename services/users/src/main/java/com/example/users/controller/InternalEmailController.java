package com.example.users.controller;

import com.example.users.dto.SendOrderEmailRequest;
import com.example.users.entity.User;
import com.example.users.repository.UserRepository;
import com.example.users.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/email") 
@RequiredArgsConstructor
@Slf4j
public class InternalEmailController {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @PostMapping("/send-order-notification")
    public ResponseEntity<String> sendOrderNotification(@RequestBody SendOrderEmailRequest request) {
        log.info("Internal API: Nhận yêu cầu gửi mail cho Order #{}", request.getOrderId());

        User user = userRepository.findById(request.getUserId()).orElse(null);
        
        if (user == null) {
            log.warn("Không tìm thấy user ID: {}, bỏ qua gửi mail.", request.getUserId());
            return ResponseEntity.badRequest().body("User not found");
        }

        emailService.sendOrderNotification(user.getEmail(), user.getName(), request);

        return ResponseEntity.ok("Email request queued");
    }
}