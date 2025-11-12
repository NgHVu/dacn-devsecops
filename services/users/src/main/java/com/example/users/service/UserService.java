package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.dto.VerifyRequest;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserService extends UserDetailsService {

    /**
     * @param registerRequest DTO chứa thông tin đăng ký.
     */
    void registerUser(RegisterRequest registerRequest);

    /**
     * @param verifyRequest DTO chứa email và OTP.
     * @return DTO chứa access token.
     */
    AuthResponse verifyAccount(VerifyRequest verifyRequest);

    /**    
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
    UserResponse findUserByEmail(String email);
}