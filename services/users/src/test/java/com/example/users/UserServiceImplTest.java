package com.example.users;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.dto.VerifyRequest; 
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.EmailService;
import com.example.users.service.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException; 
import org.springframework.security.authentication.DisabledException; 
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private EmailService emailService; 
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
        
        ReflectionTestUtils.setField(userService, "otpExpirationMinutes", 10L);

        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .isVerified(true) 
                .build();

        registerRequest = new RegisterRequest("Test User", "test@example.com", "password123");
        loginRequest = new LoginRequest("test@example.com", "password123");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("loadUserByUsername: Thành công khi tìm thấy user")
    void testLoadUserByUsername_UserFound() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        UserDetails userDetails = userService.loadUserByUsername("test@example.com");
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("test@example.com");
        assertThat(userDetails).isSameAs(testUser); 
    }

    @Test
    @DisplayName("loadUserByUsername: Ném UsernameNotFoundException khi không tìm thấy user")
    void testLoadUserByUsername_UserNotFound() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> {
            userService.loadUserByUsername("notfound@example.com");
        });
    }

    @Test
    @DisplayName("registerUser: Thành công (gửi OTP) khi email chưa được xác thực")
    void testRegisterUser_Success_ShouldSendOtp() {
        User unverifiedUser = User.builder().email(registerRequest.email()).isVerified(false).build();
        when(userRepository.findByEmail(registerRequest.email())).thenReturn(Optional.of(unverifiedUser));
        when(passwordEncoder.encode(registerRequest.password())).thenReturn("encodedPassword");
        
        doNothing().when(emailService).sendOtpEmail(anyString(), anyString());
        
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenReturn(unverifiedUser);

        userService.registerUser(registerRequest);

        verify(userRepository).findByEmail(registerRequest.email());
        verify(passwordEncoder).encode(registerRequest.password());
        verify(userRepository).save(any(User.class));
        verify(emailService, times(1)).sendOtpEmail(eq(registerRequest.email()), matches("\\d{6}"));

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo(registerRequest.email());
        assertThat(savedUser.getPassword()).isEqualTo("encodedPassword");
        assertThat(savedUser.isVerified()).isFalse(); 
        assertThat(savedUser.getVerificationOtp()).isNotNull().hasSize(6); 
        assertThat(savedUser.getOtpGeneratedTime()).isNotNull(); 
    }

    @Test
    @DisplayName("registerUser: Ném EmailAlreadyExistsException khi email đã được xác thực")
    void testRegisterUser_EmailAlreadyVerified() {
        when(userRepository.findByEmail(registerRequest.email())).thenReturn(Optional.of(testUser));

        assertThrows(EmailAlreadyExistsException.class, () -> {
            userService.registerUser(registerRequest);
        });
        
        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
    }
    
    @Test
    @DisplayName("verifyAccount: Thành công khi OTP đúng và không hết hạn")
    void testVerifyAccount_Success() {
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
        when(jwtTokenProvider.generateToken(any(Authentication.class))).thenReturn("dummy.jwt.token");

        AuthResponse authResponse = userService.verifyAccount(verifyRequest);

        assertThat(authResponse).isNotNull();
        assertThat(authResponse.accessToken()).isEqualTo("dummy.jwt.token");
        
        verify(userRepository).save(unverifiedUser);
        assertThat(unverifiedUser.isVerified()).isTrue();
        assertThat(unverifiedUser.getVerificationOtp()).isNull(); 
    }

    @Test
    @DisplayName("verifyAccount: Ném BadCredentialsException khi OTP sai")
    void testVerifyAccount_WrongOtp_ShouldThrowException() {
        User unverifiedUser = User.builder()
                .email("verify@example.com")
                .verificationOtp("123456") 
                .otpGeneratedTime(LocalDateTime.now().minusMinutes(5))
                .isVerified(false)
                .build();
        VerifyRequest verifyRequest = new VerifyRequest("verify@example.com", "654321"); // OTP sai

        when(userRepository.findByEmail(verifyRequest.email())).thenReturn(Optional.of(unverifiedUser));

        assertThrows(BadCredentialsException.class, () -> {
            userService.verifyAccount(verifyRequest);
        });
        verify(userRepository, never()).save(any()); 
    }
    
    @Test
    @DisplayName("verifyAccount: Ném BadCredentialsException khi OTP hết hạn")
    void testVerifyAccount_OtpExpired_ShouldThrowException() {
        String otp = "123456";
        User unverifiedUser = User.builder()
                .email("verify@example.com")
                .verificationOtp(otp)
                .otpGeneratedTime(LocalDateTime.now().minusMinutes(15)) 
                .isVerified(false)
                .build();
        VerifyRequest verifyRequest = new VerifyRequest("verify@example.com", otp);

        when(userRepository.findByEmail(verifyRequest.email())).thenReturn(Optional.of(unverifiedUser));

        assertThrows(BadCredentialsException.class, () -> {
            userService.verifyAccount(verifyRequest);
        });
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("loginUser: Thành công khi thông tin đúng VÀ đã xác thực")
    void testLoginUser_Success_AndVerified() {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password());
        
        when(authenticationManager.authenticate(authToken)).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(testUser);
        
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("dummy.jwt.token");

        AuthResponse authResponse = userService.loginUser(loginRequest);

        assertThat(authResponse).isNotNull();
        assertThat(authResponse.accessToken()).isEqualTo("dummy.jwt.token");
        verify(authenticationManager).authenticate(authToken);
        
        verify(jwtTokenProvider).generateToken(authentication);
    }
    
    @Test
    @DisplayName("loginUser: Ném BadCredentialsException khi tài khoản chưa xác thực (DisabledException)")
    void testLoginUser_NotVerified_ShouldThrowException() {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password());
        
        when(authenticationManager.authenticate(authToken))
                .thenThrow(new DisabledException("Tài khoản chưa được kích hoạt."));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> {
            userService.loginUser(loginRequest);
        });
        
        assertThat(ex.getMessage()).contains("Tài khoản chưa được kích hoạt");
        
        verify(jwtTokenProvider, never()).generateToken(any(Authentication.class));
    }
    
    @Test
    @DisplayName("getCurrentUser: Thành công khi người dùng đã xác thực")
    void testGetCurrentUser_Success() {
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(testUser.getEmail());
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        UserResponse userResponse = userService.getCurrentUser();
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.id()).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("findUserByEmail: Trả về UserResponse khi tìm thấy")
    void testFindUserByEmail_UserFound() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        UserResponse userResponse = userService.findUserByEmail("test@example.com");
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.id()).isEqualTo(testUser.getId());
    }
}