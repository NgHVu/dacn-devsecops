package com.example.users.config;

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
        description = "Tài liệu API cho Users Service trong dự án DevSecOps.",
        title = "OpenAPI specification - Users Service",
        version = "1.0"
    ),
    servers = {
        @Server(
            description = "Local ENV",
            url = "http://localhost:8082" 
        )
    }
)
@SecurityScheme(
    name = "bearerAuth", 
    description = "Nhập JWT token vào đây theo định dạng: Bearer {token}", // Hướng dẫn rõ ràng hơn
    scheme = "bearer",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
    // Đây là một lớp cấu hình rỗng, tất cả các thiết lập đều được thực hiện
    // thông qua annotation ở trên.
}
