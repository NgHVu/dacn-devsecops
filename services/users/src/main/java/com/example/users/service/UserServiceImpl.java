package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
// BỔ SUNG: Import @Lazy
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

import java.util.Optional;

@Service
// BỎ @RequiredArgsConstructor 
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    // TỰ VIẾT CONSTRUCTOR và thêm @Lazy vào các dependency gây vòng lặp
    public UserServiceImpl(UserRepository userRepository,
                           @Lazy PasswordEncoder passwordEncoder, // THÊM @Lazy
                           @Lazy AuthenticationManager authenticationManager, // THÊM @Lazy
                           JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }


    
    // Spring Security sử dụng để tải thông tin User từ DB.
     
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    
    //  Xử lý logic đăng ký người dùng mới.
     
    @Override
    @Transactional
    public UserResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.email())) {
            // Giúp GlobalExceptionHandler có thể bắt và trả về lỗi 409 CONFLICT.
            throw new EmailAlreadyExistsException("Email '" + registerRequest.email() + "' đã được sử dụng");
        }

        String encodedPassword = passwordEncoder.encode(registerRequest.password());

        User user = User.builder()
                .name(registerRequest.name())
                .email(registerRequest.email())
                .password(encodedPassword)
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.fromEntity(savedUser);
    }

    
    // Xử lý logic đăng nhập.
    
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

        // Đảm bảo principal là User entity
        User user = userRepository.findByEmail(authentication.getName())
                        .orElseThrow(() -> new UsernameNotFoundException("User not found after authentication"));


        String accessToken = jwtTokenProvider.generateToken(user);

        return new AuthResponse(accessToken);
    }

    
    // Lấy thông tin người dùng đang đăng nhập.
     
    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        // Lấy User từ một phương thức helper
        return UserResponse.fromEntity(getAuthenticatedUser());
    }


    // Tìm kiếm User theo email (dùng nội bộ).
    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Một phương thức helper private để lấy thông tin User đã được xác thực.
     * Giúp tái sử dụng và làm cho code của getCurrentUser() gọn hơn.
     */
     private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
             throw new IllegalStateException("Không có người dùng nào được xác thực");
        }

        String currentUserName = authentication.getName();
        return userRepository.findByEmail(currentUserName)
                 .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng đã xác thực: " + currentUserName));
     }
}
