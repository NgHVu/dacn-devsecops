package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.entity.User;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.Optional;

/**
 * Interface định nghĩa các nghiệp vụ (business logic) liên quan đến User.
 * Kế thừa UserDetailsService để tích hợp liền mạch với Spring Security.
 */
public interface UserService extends UserDetailsService {

    /**
     * Xử lý logic đăng ký người dùng mới.
     *
     * @param registerRequest DTO chứa thông tin đăng ký.
     * @return DTO chứa thông tin công khai của người dùng đã được tạo.
     */
    UserResponse registerUser(RegisterRequest registerRequest);

    /**
     * Xử lý logic đăng nhập và tạo token.
     *
     * @param loginRequest DTO chứa thông tin đăng nhập.
     * @return DTO chứa access token.
     */
    AuthResponse loginUser(LoginRequest loginRequest);

    /**
     *
     * @return DTO chứa thông tin công khai của người dùng hiện tại.
     */
    UserResponse getCurrentUser();

    /**
     *
     * @param email Email cần tìm.
     * @return Optional chứa User nếu tìm thấy.
     */
    Optional<User> findByEmail(String email);
}
