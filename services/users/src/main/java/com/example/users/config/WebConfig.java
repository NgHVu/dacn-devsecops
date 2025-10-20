package com.example.users.config;

import org.springframework.lang.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Đọc danh sách các origin được phép từ file application.properties
    // Mặc định là cho phép localhost:3000 (cho local dev)
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**") // Áp dụng cho tất cả các đường dẫn
                // SỬA LỖI: Dùng allowedOriginPatterns để tương thích với allowCredentials
                .allowedOriginPatterns(allowedOrigins) 
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true) // Cho phép gửi cookie/token
                .maxAge(3600); // Cache kết quả pre-flight (OPTIONS) trong 1 giờ
    }
}