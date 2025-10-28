package com.example.orders.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Cấu hình chung cho Web MVC, chủ yếu là CORS. 🌐
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Inject giá trị allowed-origins từ application.properties
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    /**
     * Cấu hình Cross-Origin Resource Sharing (CORS)
     * Cho phép các request từ frontend
     * gọi đến API của backend này
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") 
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS") 
                .allowedHeaders("*")
                .allowCredentials(true) 
                .maxAge(3600); 
    }
}