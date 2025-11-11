package com.example.users.controller;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth") // Base path cho tất cả các endpoint trong controller này
@RequiredArgsConstructor
@Tag(name = "Authentication API", description = "Các API dùng để đăng ký và đăng nhập")
public class AuthController {

    private final UserService userService;

    @Operation(
            summary = "Đăng ký người dùng mới",
            description = "Tạo một tài khoản người dùng mới trong hệ thống."
    )
    @ApiResponse(responseCode = "201", description = "Tạo tài khoản thành công")
    @ApiResponse(responseCode = "400", description = "Dữ liệu đầu vào không hợp lệ")
    @ApiResponse(responseCode = "409", description = "Email đã tồn tại")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        // === 2. GỌI HÀM SERVICE MỚI (CHÚNG TA SẼ SỬA NÓ Ở BƯỚC 2) ===
        AuthResponse authResponse = userService.registerUser(registerRequest);
        
        // === 3. TRẢ VỀ AUTHRESPONSE VỚI MÃ 201 CREATED ===
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @Operation(
            summary = "Đăng nhập người dùng",
            description = "Xác thực thông tin người dùng và trả về một JWT access token."
    )
    @ApiResponse(responseCode = "200", description = "Đăng nhập thành công")
    @ApiResponse(responseCode = "401", description = "Thông tin đăng nhập không chính xác")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = userService.loginUser(loginRequest);
        return ResponseEntity.ok(authResponse);
    }
}
