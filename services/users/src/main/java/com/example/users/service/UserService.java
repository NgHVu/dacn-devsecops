package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.dto.VerifyRequest;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserService extends UserDetailsService {

    void registerUser(RegisterRequest registerRequest);

    AuthResponse verifyAccount(VerifyRequest verifyRequest);

    AuthResponse loginUser(LoginRequest loginRequest);

    UserResponse getCurrentUser();

    UserResponse findUserByEmail(String email);

    void resendOtp(String email);

    AuthResponse loginWithGoogle(String authorizationCode);

    void processForgotPassword(String email);
    
    void resetPassword(String token, String newPassword);
}