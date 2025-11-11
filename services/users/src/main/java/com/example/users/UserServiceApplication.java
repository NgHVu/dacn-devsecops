package com.example.users;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync; 
/**
 * Đây là điểm khởi chạy (entry point) chính của Users Service.
 * <p>
 * Annotation {@code @SpringBootApplication} là một meta-annotation, nó bao gồm:
 * <ul>
 * <li>{@code @SpringBootConfiguration}: Đánh dấu lớp này là một nguồn cấu hình.</li>
 * <li>{@code @EnableAutoConfiguration}: Kích hoạt cơ chế tự động cấu hình của Spring Boot.</li>
 * <li>{@code @ComponentScan}: Tự động quét các component (Controller, Service, Repository,...)
 * trong package này và các package con.</li>
 * </ul>
 */
@SpringBootApplication
@EnableAsync
public class UserServiceApplication {

    /**
     * Phương thức main, điểm bắt đầu của mọi ứng dụng Java.
     * Dòng lệnh SpringApplication.run() sẽ khởi động toàn bộ ứng dụng.
     *
     * @param args Các tham số dòng lệnh (nếu có).
     */
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

}
