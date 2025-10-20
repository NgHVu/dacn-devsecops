package com.example.users.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO (Data Transfer Object) để trả về cho client sau khi đăng nhập thành công.
 * Sử dụng `record` để đảm bảo tính bất biến (immutable) và ngắn gọn.
 */
@Schema(description = "Payload chứa token truy cập sau khi xác thực thành công")
public record AuthResponse(
    @Schema(description = "JWT Access Token dùng để xác thực cho các request tiếp theo", 
            example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
    String accessToken
) {}

