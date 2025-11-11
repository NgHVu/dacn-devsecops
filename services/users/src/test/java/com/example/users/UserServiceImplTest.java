package com.example.users;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.dto.VerifyRequest; // THÊM: Import DTO mới
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.EmailService; // THÊM: Mock EmailService
import com.example.users.service.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor; // THÊM: Bắt đối số
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException; // THÊM
import org.springframework.security.authentication.DisabledException; // THÊM
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils; // THÊM: Để inject @Value

import java.math.BigDecimal;
import java.time.LocalDateTime; // THÊM
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl Tests (OTP Flow)")
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private EmailService emailService; // THÊM: Mock EmailService
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        
        // Inject giá trị @Value ("app.otp.expiration-minutes") vào service
        ReflectionTestUtils.setField(userService, "otpExpirationMinutes", 10L);

        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .isVerified(true) // User mẫu đã được xác thực
                .build();

        registerRequest = new RegisterRequest("Test User", "test@example.com", "password123");
        loginRequest = new LoginRequest("test@example.com", "password123");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // --- Test cho loadUserByUsername ---
    @Test
    @DisplayName("loadUserByUsername: Thành công khi tìm thấy user")
    void testLoadUserByUsername_UserFound() {
        // Arrange
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        // Act
        UserDetails userDetails = userService.loadUserByUsername("test@example.com");
        // Assert
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("test@example.com");
        // SỬA: User.java implements UserDetails, nên userDetails chính là testUser
        assertThat(userDetails).isSameAs(testUser); 
    }

    @Test
    @DisplayName("loadUserByUsername: Ném UsernameNotFoundException khi không tìm thấy user")
    void testLoadUserByUsername_UserNotFound() {
        // ... (Giữ nguyên, test này vẫn đúng)
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> {
            userService.loadUserByUsername("notfound@example.com");
        });
    }

    // --- Test cho registerUser (Logic OTP MỚI) ---
    @Test
    @DisplayName("registerUser: Thành công (gửi OTP) khi email chưa được xác thực")
    void testRegisterUser_Success_ShouldSendOtp() {
        // Arrange
        User unverifiedUser = User.builder().email(registerRequest.email()).isVerified(false).build();
        when(userRepository.findByEmail(registerRequest.email())).thenReturn(Optional.of(unverifiedUser));
        when(passwordEncoder.encode(registerRequest.password())).thenReturn("encodedPassword");
        
        // Giả lập (mock) hàm sendOtpEmail (hàm void)
        doNothing().when(emailService).sendOtpEmail(anyString(), anyString());
        
        // Bắt (capture) đối tượng User được lưu vào DB
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(unverifiedUser);

        // Act
        userService.registerUser(registerRequest); // Hàm này giờ là void

        // Assert
        // 1. Kiểm tra các hàm đã được gọi
        verify(userRepository).findByEmail(registerRequest.email());
        verify(passwordEncoder).encode(registerRequest.password());
        verify(userRepository).save(any(User.class));
        // 2. Kiểm tra EmailService được gọi với email và OTP (OTP là string 6 số)
        verify(emailService, times(1)).sendOtpEmail(eq(registerRequest.email()), matches("\\d{6}"));

        // 3. Kiểm tra user được lưu vào DB
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo(registerRequest.email());
        assertThat(savedUser.getPassword()).isEqualTo("encodedPassword");
        assertThat(savedUser.isVerified()).isFalse(); // Quan trọng: Phải là false
        assertThat(savedUser.getVerificationOtp()).isNotNull().hasSize(6); // Phải có OTP
        assertThat(savedUser.getOtpGeneratedTime()).isNotNull(); // Phải có thời gian
    }

    @Test
    @DisplayName("registerUser: Ném EmailAlreadyExistsException khi email đã được xác thực")
    void testRegisterUser_EmailAlreadyVerified() {
        // Arrange
        // testUser (từ setUp) có isVerified = true
        when(userRepository.findByEmail(registerRequest.email())).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThrows(EmailAlreadyExistsException.class, () -> {
            userService.registerUser(registerRequest);
        });
        
        // Đảm bảo không lưu, không gửi mail
        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
    }
    
    // --- THÊM: Test cho verifyAccount ---

    @Test
    @DisplayName("verifyAccount: Thành công khi OTP đúng và không hết hạn")
    void testVerifyAccount_Success() {
        // Arrange
        String otp = "123456";
        User unverifiedUser = User.builder()
                .email("verify@example.com")
                .verificationOtp(otp)
                .otpGeneratedTime(LocalDateTime.now().minusMinutes(5)) // 5 phút trước (còn hạn)
                .isVerified(false)
                .build();
        
        VerifyRequest verifyRequest = new VerifyRequest("verify@example.com", otp);

        when(userRepository.findByEmail(verifyRequest.email())).thenReturn(Optional.of(unverifiedUser));
        when(userRepository.save(any(User.class))).thenReturn(unverifiedUser);
        when(jwtTokenProvider.generateToken(any(User.class))).thenReturn("dummy.jwt.token");

        // Act
        AuthResponse authResponse = userService.verifyAccount(verifyRequest);

        // Assert
        assertThat(authResponse).isNotNull();
        assertThat(authResponse.accessToken()).isEqualTo("dummy.jwt.token");
        
        // Kiểm tra User đã được cập nhật
        verify(userRepository).save(unverifiedUser);
        assertThat(unverifiedUser.isVerified()).isTrue();
        assertThat(unverifiedUser.getVerificationOtp()).isNull(); // OTP đã bị xóa
    }

    @Test
    @DisplayName("verifyAccount: Ném BadCredentialsException khi OTP sai")
    void testVerifyAccount_WrongOtp_ShouldThrowException() {
        // Arrange
        User unverifiedUser = User.builder()
                .email("verify@example.com")
                .verificationOtp("123456") // OTP đúng
                .otpGeneratedTime(LocalDateTime.now().minusMinutes(5))
                .isVerified(false)
                .build();
        VerifyRequest verifyRequest = new VerifyRequest("verify@example.com", "654321"); // OTP sai

        when(userRepository.findByEmail(verifyRequest.email())).thenReturn(Optional.of(unverifiedUser));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> {
            userService.verifyAccount(verifyRequest);
        });
        verify(userRepository, never()).save(any()); // Không được lưu
    }
    
    @Test
    @DisplayName("verifyAccount: Ném BadCredentialsException khi OTP hết hạn")
    void testVerifyAccount_OtpExpired_ShouldThrowException() {
        // Arrange
        String otp = "123456";
        User unverifiedUser = User.builder()
                .email("verify@example.com")
                .verificationOtp(otp)
                .otpGeneratedTime(LocalDateTime.now().minusMinutes(15)) // Hết hạn 10 phút
                .isVerified(false)
                .build();
        VerifyRequest verifyRequest = new VerifyRequest("verify@example.com", otp);

        when(userRepository.findByEmail(verifyRequest.email())).thenReturn(Optional.of(unverifiedUser));

        // Act & Assert
        // Service ném BadCredentialsException khi hết hạn
        assertThrows(BadCredentialsException.class, () -> {
            userService.verifyAccount(verifyRequest);
        });
        verify(userRepository, never()).save(any());
    }

    // --- Test cho loginUser (Logic MỚI) ---
    @Test
    @DisplayName("loginUser: Thành công khi thông tin đúng VÀ đã xác thực")
    void testLoginUser_Success_AndVerified() {
        // Arrange
        // testUser (từ setUp) đã isVerified = true
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password());
        
        // Giả lập AuthenticationManager thành công
        when(authenticationManager.authenticate(authToken)).thenReturn(authentication);
        // Giả lập Principal trả về User object
        when(authentication.getPrincipal()).thenReturn(testUser);
        
        when(jwtTokenProvider.generateToken(testUser)).thenReturn("dummy.jwt.token");

        // Act
        AuthResponse authResponse = userService.loginUser(loginRequest);

        // Assert
        assertThat(authResponse).isNotNull();
        assertThat(authResponse.accessToken()).isEqualTo("dummy.jwt.token");
        verify(authenticationManager).authenticate(authToken);
        verify(jwtTokenProvider).generateToken(testUser);
    }
    
    @Test
    @DisplayName("loginUser: Ném BadCredentialsException khi tài khoản chưa xác thực (DisabledException)")
    void testLoginUser_NotVerified_ShouldThrowException() {
        // Arrange
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password());
        
        // Giả lập AuthenticationManager ném DisabledException (vì user.isEnabled() = false)
        when(authenticationManager.authenticate(authToken))
                .thenThrow(new DisabledException("Tài khoản chưa được kích hoạt."));

        // Act & Assert
        // Service của chúng ta bắt DisabledException và ném ra BadCredentialsException
        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> {
            userService.loginUser(loginRequest);
        });
        
        assertThat(ex.getMessage()).contains("Tài khoản chưa được kích hoạt");
        
        // Đảm bảo không tạo token
        verify(jwtTokenProvider, never()).generateToken(any(User.class));
    }
    
    // ... (Các test khác như getCurrentUser, findByEmail (đã sửa) giữ nguyên) ...

    @Test
    @DisplayName("getCurrentUser: Thành công khi người dùng đã xác thực")
    void testGetCurrentUser_Success() {
        // Arrange
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(testUser.getEmail());
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        // Act
        UserResponse userResponse = userService.getCurrentUser();
        // Assert
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.id()).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("findUserByEmail: Trả về UserResponse khi tìm thấy")
    void testFindUserByEmail_UserFound() {
        // Arrange
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        // Act
        UserResponse userResponse = userService.findUserByEmail("test@example.com");
        // Assert
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.id()).isEqualTo(testUser.getId());
    }
}