package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.Optional;


@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public UserServiceImpl(UserRepository userRepository,
                           @Lazy PasswordEncoder passwordEncoder,
                           @Lazy AuthenticationManager authenticationManager,
                           JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        // Trả về UserDetails của Spring Security
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.emptyList()
        );
    }

    @Override
    @Transactional
    public AuthResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.email())) {
            throw new EmailAlreadyExistsException("Email '" + registerRequest.email() + "' đã được sử dụng");
        }
        String encodedPassword = passwordEncoder.encode(registerRequest.password());
        User user = User.builder()
                .name(registerRequest.name())
                .email(registerRequest.email())
                .password(encodedPassword)
                .build();
        User savedUser = userRepository.save(user);

        // 2. THÊM LOGIC TẠO TOKEN (Giống hệt hàm login)
        // Dùng user vừa được lưu để tạo token
        String accessToken = jwtTokenProvider.generateToken(savedUser);
        
        // Trả về AuthResponse (chứa token) thay vì UserResponse
        return new AuthResponse(accessToken);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse loginUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.email(),
                        loginRequest.password()
                )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        User user = userRepository.findByEmail(authentication.getName())
                        .orElseThrow(() -> new UsernameNotFoundException("User not found after authentication"));
        String accessToken = jwtTokenProvider.generateToken(user);
        return new AuthResponse(accessToken);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        User authenticatedUser = getAuthenticatedUser();
        return UserResponse.fromEntity(authenticatedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
             throw new IllegalStateException("Không có người dùng nào được xác thực");
        }

        // SỬA: Ưu tiên dùng getName() vì nó đáng tin cậy hơn principal
        String currentUserName = authentication.getName();
        if (currentUserName == null) {
            // Trường hợp hy hữu principal không trả về tên hợp lệ
             throw new IllegalStateException("Không thể xác định tên người dùng từ Security Context");
        }


        return userRepository.findByEmail(currentUserName)
                 .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng đã xác thực: " + currentUserName));
     }
}

