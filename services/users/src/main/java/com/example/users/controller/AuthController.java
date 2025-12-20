package com.example.users.controller;

import com.example.users.dto.ResendOtpRequest;
import com.example.users.dto.ResetPasswordRequest;
import com.example.users.dto.AuthResponse;
import com.example.users.dto.EmailRequest;
import com.example.users.dto.GoogleAuthRequest;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.VerifyRequest; 
import com.example.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Lazy; 
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/auth") 
@Tag(name = "Authentication API", description = "Các API dùng để đăng ký, xác thực và đăng nhập")
public class AuthController {

    private final UserService userService;

    public AuthController(@Lazy UserService userService) {
        this.userService = userService;
    }

    @Operation(
            summary = "1. Đăng ký tài khoản (Gửi OTP)",
            description = "Tiếp nhận thông tin đăng ký (tên, email, pass) và gửi mã OTP về email."
    )
    @ApiResponse(responseCode = "201", description = "Đã gửi OTP thành công")
    @ApiResponse(responseCode = "400", description = "Dữ liệu đầu vào không hợp lệ")
    @ApiResponse(responseCode = "409", description = "Email đã được xác thực (đã tồn tại)")
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        userService.registerUser(registerRequest); 
        return ResponseEntity.status(HttpStatus.CREATED)
                             .body("Đã gửi OTP đến email. Vui lòng xác thực.");
    }

    @Operation(
            summary = "2. Xác thực tài khoản (Verify OTP)",
            description = "Xác thực email và mã OTP. Trả về JWT token nếu thành công."
    )
    @ApiResponse(responseCode = "200", description = "Xác thực thành công, trả về token")
    @ApiResponse(responseCode = "400", description = "OTP không đúng hoặc đã hết hạn")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy email")
    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verifyAccount(@Valid @RequestBody VerifyRequest verifyRequest) {
        AuthResponse authResponse = userService.verifyAccount(verifyRequest);
        return ResponseEntity.ok(authResponse);
    }
    
    @Operation(
            summary = "3. Đăng nhập",
            description = "Xác thực email/mật khẩu VÀ kiểm tra tài khoản đã được kích hoạt chưa."
    )
    @ApiResponse(responseCode = "200", description = "Đăng nhập thành công")
    @ApiResponse(responseCode = "401", description = "Sai thông tin hoặc tài khoản chưa được kích hoạt")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = userService.loginUser(loginRequest);
        return ResponseEntity.ok(authResponse);
    }

    @Operation(
            summary = "4. Gửi lại mã OTP",
            description = "Tạo và gửi lại mã OTP mới cho email chưa được xác thực."
    )
    @ApiResponse(responseCode = "200", description = "Đã gửi lại OTP thành công")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy email")
    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(@Valid @RequestBody ResendOtpRequest resendRequest) {
        userService.resendOtp(resendRequest.email());
        return ResponseEntity.ok("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    }

     @Operation(
            summary = "5. Đăng nhập bằng Google",
            description = "Trao đổi 'authorization code' để lấy JWT token."
    )
    @ApiResponse(responseCode = "200", description = "Đăng nhập Google thành công, trả về token")
    @ApiResponse(responseCode = "400", description = "Code không hợp lệ hoặc có lỗi khi gọi Google")
    @PostMapping("/oauth/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        AuthResponse authResponse = userService.loginWithGoogle(request.code());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "6. Yêu cầu link reset mật khẩu", description = "Bắt đầu luồng quên mật khẩu. Sẽ gửi email nếu user tồn tại.")
    @ApiResponse(responseCode = "200", description = "Yêu cầu đã được xử lý (luôn trả về 200 để tránh email enumeration)")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody EmailRequest emailRequest) {
        userService.processForgotPassword(emailRequest.email());
        return ResponseEntity.ok("Chúng tôi đã gửi cách lấy lại mật khẩu cho bạn.");
    }

    @GetMapping("/validate-reset-token")
    @Operation(summary = "7.Kiểm tra tính hợp lệ của token reset mật khẩu", description = "Kiểm tra token ngay khi trang reset được tải")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Token hợp lệ"),
        @ApiResponse(responseCode = "400", description = "Token không hợp lệ, đã sử dụng, hoặc hết hạn")
    })
    public ResponseEntity<Void> validateResetToken(@RequestParam String token) {
        userService.validateResetToken(token);
        return ResponseEntity.ok().build(); 
    }

    @PostMapping("/reset-password")
    @Operation(summary = "8. Đặt lại mật khẩu mới", description = "Sử dụng token từ email để đặt lại mật khẩu.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Mật khẩu đã được reset thành công"),
        @ApiResponse(responseCode = "400", description = "Token không hợp lệ hoặc đã hết hạn")
    })
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest resetRequest) {
        userService.resetPassword(resetRequest.token(), resetRequest.newPassword());
        return ResponseEntity.ok("Mật khẩu của bạn đã được cập nhật thành công.");
    }
}