package com.example.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing; 


// Lớp chính (Main Class) để khởi chạy Orders Service.
@SpringBootApplication
@EnableJpaAuditing // Kích hoạt tính năng tự động điền @CreatedDate và @LastModifiedDate
public class OrderServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(OrderServiceApplication.class, args);
	}

}