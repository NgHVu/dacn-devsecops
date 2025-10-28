package com.example.orders.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
    info = @Info(
        contact = @Contact(
            name = "Hoang Vu",
            email = "nhoangvu2306@gmail.com"
        ),
        description = "Tài liệu API cho Orders Service trong dự án DevSecOps.",
        title = "OpenAPI specification - Orders Service",
        version = "1.0"
    ),
    servers = {
        @Server(
            description = "Local ENV",
            url = "http://localhost:8083" // Cổng của orders-service
        )
    }
)
@SecurityScheme( // Định nghĩa cơ chế bảo mật JWT Bearer
    name = "bearerAuth", 
    description = "Nhập JWT token vào đây theo định dạng: Bearer {token}",
    scheme = "bearer",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}