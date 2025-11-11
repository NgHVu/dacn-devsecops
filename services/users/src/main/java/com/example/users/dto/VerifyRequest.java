package com.example.users.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO (Data Transfer Object) để nhận yêu cầu xác thực OTP.
 */
@Schema(description = "Payload chứa email và OTP để xác thực tài khoản")
public record VerifyRequest(
        @Schema(description = "Email đã đăng ký", example = "test@example.com")
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        @Schema(description = "Mã OTP gồm 6 chữ số đã được gửi qua email", example = "123456")
        @NotBlank(message = "OTP không được để trống")
        @Size(min = 6, max = 6, message = "OTP phải có đúng 6 chữ số")
        String otp
) {
}