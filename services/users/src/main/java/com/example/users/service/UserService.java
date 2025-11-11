package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.dto.VerifyRequest; // <-- THÊM IMPORT
import org.springframework.security.core.userdetails.UserDetailsService;

// Bỏ import Optional và User entity (Interface không nên lộ Entity)
// import java.util.Optional;
// import com.example.users.entity.User;


/**
 * Interface định nghĩa các nghiệp vụ (business logic) liên quan đến User.
 * Kế thừa UserDetailsService để tích hợp liền mạch với Spring Security.
 */
public interface UserService extends UserDetailsService {

    /**
     * Sửa đổi: Hàm này giờ chỉ xử lý đăng ký và gửi OTP.
     * Không trả về token nữa.
     *
     * @param registerRequest DTO chứa thông tin đăng ký.
     */
    void registerUser(RegisterRequest registerRequest); // <-- SỬA: Trả về void

    /**
     * THÊM MỚI: Hàm này xác thực OTP và trả về token nếu thành công.
     *
     * @param verifyRequest DTO chứa email và OTP.
     * @return DTO chứa access token.
     */
    AuthResponse verifyAccount(VerifyRequest verifyRequest); // <-- THÊM MỚI

    /**
     * Sửa đổi: Hàm này giờ sẽ kiểm tra xem user.isVerified()
     * trước khi cho phép đăng nhập.
     *
     * @param loginRequest DTO chứa thông tin đăng nhập.
     * @return DTO chứa access token.
     */
    AuthResponse loginUser(LoginRequest loginRequest);

    /**
     * Lấy thông tin người dùng hiện tại (đã xác thực).
     *
     * @return DTO chứa thông tin công khai của người dùng hiện tại.
     */
    UserResponse getCurrentUser();

    /**
     * Lấy thông tin người dùng bằng email (dùng cho nội bộ service).
     *
     * @param email Email cần tìm.
     * @return DTO chứa thông tin công khai của người dùng.
     */
    UserResponse findUserByEmail(String email); // <-- Sửa: Trả về DTO thay vì Entity
}