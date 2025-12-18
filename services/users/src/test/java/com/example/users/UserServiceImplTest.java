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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
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
@DisplayName("UserServiceImpl High Coverage Tests")
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EmailService emailService;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;
    
    // Mocks for Google OAuth
    @Mock private ClientRegistrationRepository clientRegistrationRepository;
    @Mock private WebClient.Builder webClientBuilder;
    @Mock private WebClient webClient;
    @Mock private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock private WebClient.RequestBodySpec requestBodySpec;
    @Mock private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock private WebClient.ResponseSpec responseSpec;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private final String EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ReflectionTestUtils.setField(userService, "otpExpirationMinutes", 10L);
        ReflectionTestUtils.setField(userService, "googleRedirectUri", "http://localhost/callback");

        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email(EMAIL)
                .password("encodedPassword")
                .role(Role.ROLE_USER)
                .isVerified(true)
                .accountNonLocked(true)
                .verificationOtp("123456")
                .otpGeneratedTime(LocalDateTime.now())
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

    // --- 1. REGISTRATION & OTP ---

    @Test
    @DisplayName("registerUser: Success - New user")
    void registerUser_NewUser_Success() {
        RegisterRequest req = new RegisterRequest("New", "new@test.com", "pass");
        when(userRepository.findByEmail(req.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        userService.registerUser(req);

        verify(userRepository).save(any(User.class));
        verify(emailService).sendOtpEmail(eq("new@test.com"), anyString());
    }

    @Test
    @DisplayName("registerUser: Success - Existing but unverified user (Resend/Update)")
    void registerUser_ExistingUnverified_Success() {
        RegisterRequest req = new RegisterRequest("Update", EMAIL, "newPass");
        testUser.setVerified(false); // User exists but not verified
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(any())).thenReturn("newHashed");

        userService.registerUser(req);

        verify(userRepository).save(testUser);
        verify(emailService).sendOtpEmail(eq(EMAIL), anyString());
    }

    @Test
    @DisplayName("registerUser: Fail - Email already verified")
    void registerUser_VerifiedEmail_ThrowsException() {
        RegisterRequest req = new RegisterRequest("Test", EMAIL, "pass");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser)); // User verified = true

        assertThrows(EmailAlreadyExistsException.class, () -> userService.registerUser(req));
    }

    @Test
    @DisplayName("resendOtp: Success")
    void resendOtp_Success() {
        testUser.setVerified(false);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        
        userService.resendOtp(EMAIL);
        
        verify(emailService).sendOtpEmail(eq(EMAIL), anyString());
    }

    @Test
    @DisplayName("resendOtp: Fail - User not found")
    void resendOtp_NotFound_ThrowsException() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.resendOtp(EMAIL));
    }

    @Test
    @DisplayName("resendOtp: Fail - Already verified")
    void resendOtp_AlreadyVerified_ThrowsException() {
        testUser.setVerified(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        
        assertThrows(IllegalStateException.class, () -> userService.resendOtp(EMAIL));
    }

    // --- 2. VERIFICATION ---

    @Test
    @DisplayName("verifyAccount: Success")
    void verifyAccount_Success() {
        testUser.setVerified(false);
        VerifyRequest req = new VerifyRequest(EMAIL, "123456");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateToken(any())).thenReturn("token");

        AuthResponse res = userService.verifyAccount(req);

        assertThat(res.accessToken()).isEqualTo("token");
        assertThat(testUser.isVerified()).isTrue();
    }

    @Test
    @DisplayName("verifyAccount: Fail - User not found")
    void verifyAccount_NotFound_ThrowsException() {
        VerifyRequest req = new VerifyRequest(EMAIL, "123456");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.verifyAccount(req));
    }

    @Test
    @DisplayName("verifyAccount: Fail - Already verified")
    void verifyAccount_AlreadyVerified_ThrowsException() {
        testUser.setVerified(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        VerifyRequest req = new VerifyRequest(EMAIL, "123456");
        assertThrows(IllegalStateException.class, () -> userService.verifyAccount(req));
    }

    @Test
    @DisplayName("verifyAccount: Fail - OTP Expired")
    void verifyAccount_ExpiredOtp_ThrowsException() {
        testUser.setVerified(false);
        testUser.setOtpGeneratedTime(LocalDateTime.now().minusMinutes(20)); // Expired
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        VerifyRequest req = new VerifyRequest(EMAIL, "123456");
        
        assertThrows(BadCredentialsException.class, () -> userService.verifyAccount(req));
    }

    @Test
    @DisplayName("verifyAccount: Fail - Wrong OTP")
    void verifyAccount_WrongOtp_ThrowsException() {
        testUser.setVerified(false);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        VerifyRequest req = new VerifyRequest(EMAIL, "999999"); // Wrong code
        
        assertThrows(BadCredentialsException.class, () -> userService.verifyAccount(req));
    }

    // --- 3. LOGIN ---

    @Test
    @DisplayName("loginUser: Success")
    void loginUser_Success() {
        LoginRequest req = new LoginRequest(EMAIL, "pass");
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("token");

        AuthResponse res = userService.loginUser(req);
        assertThat(res.accessToken()).isEqualTo("token");
    }

    @Test
    @DisplayName("loginUser: Fail - Disabled (Unverified)")
    void loginUser_Disabled_ThrowsException() {
        LoginRequest req = new LoginRequest(EMAIL, "pass");
        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("Disabled"));

        assertThrows(BadCredentialsException.class, () -> userService.loginUser(req));
    }

    @Test
    @DisplayName("loginUser: Fail - Bad Credentials")
    void loginUser_BadCredentials_ThrowsException() {
        LoginRequest req = new LoginRequest(EMAIL, "pass");
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> userService.loginUser(req));
    }

    // --- 4. GOOGLE OAUTH ---

    @Test
    @DisplayName("loginWithGoogle: Success (Create new user)")
    void loginWithGoogle_Success_NewUser() {
        mockGoogleFlow("new@google.com", true);
        when(userRepository.findByEmail("new@google.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwtTokenProvider.generateToken(any())).thenReturn("jwt");

        AuthResponse res = userService.loginWithGoogle("code");
        assertThat(res.accessToken()).isEqualTo("jwt");
    }

    @Test
    @DisplayName("loginWithGoogle: Success (Existing user)")
    void loginWithGoogle_Success_ExistingUser() {
        mockGoogleFlow(EMAIL, true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateToken(any())).thenReturn("jwt");

        AuthResponse res = userService.loginWithGoogle("code");
        assertThat(res.accessToken()).isEqualTo("jwt");
    }

    @Test
    @DisplayName("loginWithGoogle: Fail - Missing Config")
    void loginWithGoogle_MissingConfig_ThrowsException() {
        when(clientRegistrationRepository.findByRegistrationId("google")).thenReturn(null);
        assertThrows(IllegalStateException.class, () -> userService.loginWithGoogle("code"));
    }

    @Test
    @DisplayName("loginWithGoogle: Fail - Google Email Not Verified")
    void loginWithGoogle_UnverifiedGoogleEmail_ThrowsException() {
        mockGoogleFlow(EMAIL, false); // verified = false
        assertThrows(BadCredentialsException.class, () -> userService.loginWithGoogle("code"));
    }

    private void mockGoogleFlow(String email, boolean emailVerified) {
        ClientRegistration registration = mock(ClientRegistration.class, RETURNS_DEEP_STUBS);
        // FIX: Sử dụng lenient() để tránh lỗi UnnecessaryStubbing khi test case fail sớm
        lenient().when(clientRegistrationRepository.findByRegistrationId("google")).thenReturn(registration);
        
        lenient().when(registration.getClientId()).thenReturn("client-id");
        lenient().when(registration.getClientSecret()).thenReturn("client-secret");
        lenient().when(registration.getProviderDetails().getTokenUri()).thenReturn("http://token-uri");
        lenient().when(registration.getProviderDetails().getUserInfoEndpoint().getUri()).thenReturn("http://userinfo-uri");

        lenient().when(webClientBuilder.build()).thenReturn(webClient);
        
        // Mock Token Call
        lenient().when(webClient.post()).thenReturn(requestBodyUriSpec);
        lenient().when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.contentType(any())).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        lenient().when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        
        GoogleTokenResponse mockTokenResponse = mock(GoogleTokenResponse.class);
        lenient().when(mockTokenResponse.accessToken()).thenReturn("at");
        lenient().when(responseSpec.bodyToMono(GoogleTokenResponse.class)).thenReturn(Mono.just(mockTokenResponse));
        
        // Mock UserInfo Call
        lenient().when(webClient.get()).thenReturn(requestHeadersUriSpec);
        lenient().when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
        lenient().when(requestHeadersSpec.header(anyString(), anyString())).thenReturn(requestHeadersSpec);
        lenient().when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        
        GoogleUserInfo mockUserInfo = mock(GoogleUserInfo.class);
        lenient().when(mockUserInfo.email()).thenReturn(email);
        lenient().when(mockUserInfo.name()).thenReturn("Name");
        lenient().when(mockUserInfo.emailVerified()).thenReturn(emailVerified);
        lenient().when(responseSpec.bodyToMono(GoogleUserInfo.class)).thenReturn(Mono.just(mockUserInfo));
    }

    // --- 5. PASSWORD RECOVERY ---

    @Test
    @DisplayName("processForgotPassword: Success")
    void forgotPassword_Success() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        userService.processForgotPassword(EMAIL);
        verify(emailService).sendPasswordResetEmail(eq(EMAIL), anyString());
    }

    @Test
    @DisplayName("processForgotPassword: Fail - Not Found")
    void forgotPassword_NotFound_ThrowsException() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.processForgotPassword(EMAIL));
    }

    @Test
    @DisplayName("processForgotPassword: Fail - Unverified")
    void forgotPassword_Unverified_ThrowsException() {
        testUser.setVerified(false);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        assertThrows(BadCredentialsException.class, () -> userService.processForgotPassword(EMAIL));
    }

    @Test
    @DisplayName("validateResetToken: Fail - Token not found")
    void validateResetToken_NotFound_ThrowsException() {
        when(userRepository.findByResetPasswordToken("invalid")).thenReturn(Optional.empty());
        assertThrows(BadCredentialsException.class, () -> userService.validateResetToken("invalid"));
    }

    @Test
    @DisplayName("validateResetToken: Fail - Token Expired")
    void validateResetToken_Expired_ThrowsException() {
        testUser.setResetPasswordToken("expired");
        testUser.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByResetPasswordToken("expired")).thenReturn(Optional.of(testUser));
        
        assertThrows(BadCredentialsException.class, () -> userService.validateResetToken("expired"));
    }

    @Test
    @DisplayName("resetPassword: Fail - Token Not Found")
    void resetPassword_NotFound_ThrowsException() {
        when(userRepository.findByResetPasswordToken("invalid")).thenReturn(Optional.empty());
        assertThrows(BadCredentialsException.class, () -> userService.resetPassword("invalid", "newPass"));
    }

    // --- 6. PROFILE & AVATAR ---

    @Test
    @DisplayName("changePassword: Fail - Wrong old password")
    void changePassword_WrongOld_ThrowsException() {
        mockUserAuthentication();
        ChangePasswordRequest req = new ChangePasswordRequest("wrong", "new", "new");
        when(passwordEncoder.matches("wrong", testUser.getPassword())).thenReturn(false);
        
        assertThrows(BadCredentialsException.class, () -> userService.changePassword(req));
    }

    @Test
    @DisplayName("changePassword: Fail - Mismatch confirm password")
    void changePassword_Mismatch_ThrowsException() {
        mockUserAuthentication();
        ChangePasswordRequest req = new ChangePasswordRequest("encodedPassword", "new", "diff");
        when(passwordEncoder.matches("encodedPassword", testUser.getPassword())).thenReturn(true);
        
        assertThrows(BadCredentialsException.class, () -> userService.changePassword(req));
    }

    @Test
    @DisplayName("uploadAvatar: Success (Mock Files)")
    void uploadAvatar_Success() throws Exception {
        mockUserAuthentication();
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "data".getBytes());

        try (MockedStatic<Files> mockedFiles = mockStatic(Files.class)) {
            mockedFiles.when(() -> Files.exists(any(Path.class))).thenReturn(false);
            mockedFiles.when(() -> Files.createDirectories(any(Path.class))).thenReturn(null);
            mockedFiles.when(() -> Files.copy(any(InputStream.class), any(Path.class), any(CopyOption[].class))).thenReturn(0L);

            String url = userService.uploadAvatar(file);
            assertThat(url).contains("/uploads/avatars/");
        }
    }

    @Test
    @DisplayName("uploadAvatar: Fail - Empty file")
    void uploadAvatar_Empty_ThrowsException() {
        mockUserAuthentication();
        MockMultipartFile file = new MockMultipartFile("file", "", "image/png", new byte[0]);
        assertThrows(RuntimeException.class, () -> userService.uploadAvatar(file));
    }

    @Test
    @DisplayName("uploadAvatar: Fail - IO Error")
    void uploadAvatar_IOError_ThrowsException() {
        mockUserAuthentication();
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "data".getBytes());
        
        try (MockedStatic<Files> mockedFiles = mockStatic(Files.class)) {
            mockedFiles.when(() -> Files.exists(any())).thenReturn(true);
            mockedFiles.when(() -> Files.copy(any(InputStream.class), any(Path.class), any(CopyOption[].class)))
                       .thenThrow(new IOException("Disk error"));
            
            assertThrows(RuntimeException.class, () -> userService.uploadAvatar(file));
        }
    }

    // --- 7. ADMIN & MISC ---

    @Test
    @DisplayName("lockUser: Fail - User not found")
    void lockUser_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.lockUser(99L, true));
    }

    @Test
    @DisplayName("getUserById: Success")
    void getUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        UserResponse res = userService.getUserById(1L);
        assertThat(res.email()).isEqualTo(EMAIL);
    }

    @Test
    @DisplayName("findUserByEmail: Success")
    void findUserByEmail_Success() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(testUser));
        UserResponse res = userService.findUserByEmail(EMAIL);
        assertThat(res.id()).isEqualTo(1L);
    }
}