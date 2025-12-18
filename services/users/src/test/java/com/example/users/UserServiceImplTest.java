package com.example.users;

import com.example.users.dto.*;
import com.example.users.entity.Role;
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.exception.ResourceNotFoundException;
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
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
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

import java.io.InputStream;
import java.nio.file.CopyOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl Comprehensive Tests")
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EmailService emailService;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private final String EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ReflectionTestUtils.setField(userService, "otpExpirationMinutes", 10L);

        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email(EMAIL)
                .password("encodedPassword")
                .role(Role.ROLE_USER)
                .isVerified(true)
                .accountNonLocked(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockUserAuthentication() {
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(EMAIL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
    }

    // --- 1. REGISTRATION & VERIFICATION ---

    @Test
    @DisplayName("registerUser: Success - Should send OTP for new user")
    void registerUser_NewUser_Success() {
        RegisterRequest req = new RegisterRequest("New", "new@test.com", "pass");
        when(userRepository.findByEmail(req.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        userService.registerUser(req);

        verify(userRepository).save(any(User.class));
        verify(emailService).sendOtpEmail(eq("new@test.com"), anyString());
    }

    @Test
    @DisplayName("registerUser: Fail - Email already verified")
    void registerUser_VerifiedEmail_ThrowsException() {
        RegisterRequest req = new RegisterRequest("Test", EMAIL, "pass");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));

        assertThrows(EmailAlreadyExistsException.class, () -> userService.registerUser(req));
    }

    @Test
    @DisplayName("verifyAccount: Success - Should enable user and return token")
    void verifyAccount_ValidOtp_Success() {
        User unverified = User.builder().email(EMAIL).verificationOtp("123456")
                .otpGeneratedTime(LocalDateTime.now()).isVerified(false).build();
        VerifyRequest req = new VerifyRequest(EMAIL, "123456");

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(unverified));
        when(jwtTokenProvider.generateToken(any())).thenReturn("token");

        AuthResponse res = userService.verifyAccount(req);

        assertThat(res.accessToken()).isEqualTo("token");
        assertThat(unverified.isVerified()).isTrue();
        verify(userRepository).save(unverified);
    }

    // --- 2. FORGOT & RESET PASSWORD ---

    @Test
    @DisplayName("processForgotPassword: Success - Should generate token and send email")
    void forgotPassword_Success() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));

        userService.processForgotPassword(EMAIL);

        assertThat(testUser.getResetPasswordToken()).isNotNull();
        verify(emailService).sendPasswordResetEmail(eq(EMAIL), anyString());
    }

    @Test
    @DisplayName("resetPassword: Success - Should update password and clear token")
    void resetPassword_ValidToken_Success() {
        testUser.setResetPasswordToken("valid-token");
        testUser.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));

        when(userRepository.findByResetPasswordToken("valid-token")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("newPass")).thenReturn("newHashedPass");

        userService.resetPassword("valid-token", "newPass");

        assertThat(testUser.getPassword()).isEqualTo("newHashedPass");
        assertThat(testUser.getResetPasswordToken()).isNull();
    }

    @Test
    @DisplayName("resetPassword: Fail - Token expired")
    void resetPassword_ExpiredToken_ThrowsException() {
        testUser.setResetPasswordToken("expired");
        testUser.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));

        when(userRepository.findByResetPasswordToken("expired")).thenReturn(Optional.of(testUser));

        assertThrows(BadCredentialsException.class, () -> userService.resetPassword("expired", "pass"));
    }

    // --- 3. PROFILE MANAGEMENT ---

    @Test
    @DisplayName("updateProfile: Should update provided fields only")
    void updateProfile_PartialUpdate() {
        mockUserAuthentication();
        UpdateProfileRequest req = new UpdateProfileRequest("Updated Name", null, "New Address");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        UserResponse res = userService.updateProfile(req);

        assertThat(res.name()).isEqualTo("Updated Name");
        assertThat(res.address()).isEqualTo("New Address");
    }

    @Test
    @DisplayName("changePassword: Success")
    void changePassword_Success() {
        mockUserAuthentication();
        ChangePasswordRequest req = new ChangePasswordRequest("oldPass", "newPass", "newPass");

        when(passwordEncoder.matches("oldPass", testUser.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("newHashed");

        assertDoesNotThrow(() -> userService.changePassword(req));
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("uploadAvatar: Success - No physical file created")
    void uploadAvatar_Success() throws Exception {
        mockUserAuthentication();
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "data".getBytes());

        // Sử dụng MockedStatic để giả lập lớp Files
        // Điều này ngăn cản việc ghi file thật xuống ổ đĩa nhưng code vẫn chạy qua logic xử lý
        try (MockedStatic<Files> mockedFiles = mockStatic(Files.class)) {
            // Giả lập thư mục đã tồn tại
            mockedFiles.when(() -> Files.exists(any(Path.class))).thenReturn(true);
            // Giả lập lệnh copy không làm gì cả
            mockedFiles.when(() -> Files.copy(any(InputStream.class), any(Path.class), any(CopyOption[].class)))
                       .thenReturn(0L);

            String url = userService.uploadAvatar(file);

            assertThat(url).contains("/uploads/avatars/");
            assertThat(testUser.getAvatar()).isEqualTo(url);
            verify(userRepository).save(testUser);
        }
    }

    // --- 4. ADMIN OPERATIONS ---

    @Test
    @DisplayName("getAllUsers: Should return page of UserResponse")
    void getAllUsers_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(testUser)));

        Page<UserResponse> res = userService.getAllUsers(pageable);

        assertThat(res.getContent()).hasSize(1);
        assertThat(res.getContent().get(0).email()).isEqualTo(EMAIL);
    }

    @Test
    @DisplayName("lockUser: Success - Lock non-admin user")
    void lockUser_User_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        userService.lockUser(1L, true);

        assertThat(testUser.isAccountNonLocked()).isFalse();
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("lockUser: Fail - Cannot lock Admin")
    void lockUser_Admin_ThrowsException() {
        testUser.setRole(Role.ROLE_ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () -> userService.lockUser(1L, true));
    }

    // --- 5. EDGE CASES ---

    @Test
    @DisplayName("getCurrentUser: Fail - Not authenticated")
    void getCurrentUser_Unauthenticated_ThrowsException() {
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null);

        assertThrows(BadCredentialsException.class, () -> userService.getCurrentUser());
    }

    @Test
    @DisplayName("loadUserByUsername: Fail - User not found")
    void loadUserByUsername_NotFound_ThrowsException() {
        when(userRepository.findByEmail("none@test.com")).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> userService.loadUserByUsername("none@test.com"));
    }
}