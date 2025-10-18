package com.example.products;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Điểm khởi động của Products Service (Spring Boot).
 *
 * Gợi ý:
 * - Các package entity/repository/controller đều nằm dưới com.example.products
 *   nên KHÔNG cần @EnableJpaRepositories hay @EntityScan.
 * - CORS đã cấu hình bằng WebMvcConfigurer trong WebConfig (không dùng properties).
 */
@SpringBootApplication
@OpenAPIDefinition(
    info = @Info(
        title = "Products Service API",
        version = "v1",
        description = "API quản lý sản phẩm cho hệ thống đặt món ăn.",
        contact = @Contact(
            name = "Vu",         // <-- Điền tên của bạn
            email = "nhoangvu2306@gmail.com",       // <-- Điền email liên hệ
            url = "https://github.com/NgHVu"    // <-- (tuỳ chọn) Trang web/GitHub
        )
    )
)
public class ProductServiceApplication {

    public static void main(String[] args) {
        // Giữ SpringApplication.run đơn giản để startup nhanh, log sạch
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
