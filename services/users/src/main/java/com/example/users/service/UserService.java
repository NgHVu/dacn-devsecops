package com.example.users.service;

import com.example.users.dto.*;
import org.springframework.data.domain.Page;     
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.multipart.MultipartFile; 

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

    void validateResetToken(String token);

    UserResponse updateProfile(UpdateProfileRequest request);

    void changePassword(ChangePasswordRequest request);

    String uploadAvatar(MultipartFile file);

    Page<UserResponse> getAllUsers(Pageable pageable);

    UserResponse getUserById(Long id); 

    void lockUser(Long id, boolean lock); 
}