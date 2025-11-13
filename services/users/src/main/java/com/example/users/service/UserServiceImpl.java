package com.example.users.service;

import com.example.users.dto.*;
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper; 
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpHeaders; 
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import java.security.SecureRandom; 
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor 
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    @Lazy private final PasswordEncoder passwordEncoder;
    @Lazy private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    private final ClientRegistrationRepository clientRegistrationRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper; 

    @Value("${app.otp.expiration-minutes:10}")
    private long otpExpirationMinutes;
    
    @Value("${app.oauth.google.redirect-uri}") 
    private String googleRedirectUri;

    private static final Random OTP_RANDOM = new SecureRandom();
    private static final String USER_NOT_FOUND_MSG = "Không tìm thấy người dùng với email: ";

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND_MSG + email));
    }

    @Override
    @Transactional
    public void registerUser(RegisterRequest registerRequest) {
        User user = userRepository.findByEmail(registerRequest.email()).orElse(new User());
        if (user.isVerified()) {
            log.warn("Email đã tồn tại và đã xác thực: {}", registerRequest.email());
            throw new EmailAlreadyExistsException("Email '" + registerRequest.email() + "' đã được sử dụng");
        }
        String encodedPassword = passwordEncoder.encode(registerRequest.password());
        String otp = generateOtp();
        user.setName(registerRequest.name());
        user.setEmail(registerRequest.email());
        user.setPassword(encodedPassword);
        user.setVerificationOtp(otp);
        user.setOtpGeneratedTime(LocalDateTime.now());
        user.setVerified(false);
        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), otp);
        log.info("Đã lưu user và gửi OTP đến email: {}", user.getEmail());
    }

    @Override
    @Transactional
    public AuthResponse verifyAccount(VerifyRequest verifyRequest) {
        log.info("Đang xác thực OTP cho email: {}", verifyRequest.email());
        User user = userRepository.findByEmail(verifyRequest.email())
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND_MSG + verifyRequest.email()));
        if (user.isVerified()) {
            throw new IllegalStateException("Tài khoản đã được xác thực trước đó.");
        }
        if (user.getOtpGeneratedTime().plusMinutes(otpExpirationMinutes).isBefore(LocalDateTime.now())) {
            log.warn("Mã OTP đã hết hạn cho email: {}", verifyRequest.email());
            throw new BadCredentialsException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }
        if (!user.getVerificationOtp().equals(verifyRequest.otp())) {
            log.warn("Mã OTP không chính xác cho email: {}", verifyRequest.email());
            throw new BadCredentialsException("Mã OTP không chính xác.");
        }
        user.setVerified(true);
        user.setVerificationOtp(null);
        user.setOtpGeneratedTime(null);
        userRepository.save(user);
        log.info("Xác thực tài khoản thành công cho email: {}", user.getEmail());
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String accessToken = jwtTokenProvider.generateToken(user);
        return new AuthResponse(accessToken);
    }

    @Override
    @Transactional
    public AuthResponse loginUser(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.email(),
                            loginRequest.password()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            User user = (User) authentication.getPrincipal();
            String accessToken = jwtTokenProvider.generateToken(user);
            return new AuthResponse(accessToken);
        } catch (DisabledException e) {
            log.warn("Đăng nhập thất bại: Tài khoản chưa được kích hoạt cho email: {}", loginRequest.email());
            throw new BadCredentialsException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực OTP.");
        } catch (BadCredentialsException e) {
            log.warn("Đăng nhập thất bại: Sai thông tin đăng nhập cho email: {}", loginRequest.email());
            throw new BadCredentialsException("Thông tin đăng nhập không chính xác.");
        }
    }

    @Override
    @Transactional
    public void resendOtp(String email) {
        log.info("Yêu cầu gửi lại OTP cho email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND_MSG + email));
        if (user.isVerified()) {
            log.warn("Tài khoản {} đã được xác thực, không cần gửi lại OTP.", email);
            throw new IllegalStateException("Tài khoản này đã được kích hoạt.");
        }
        String otp = generateOtp();
        user.setVerificationOtp(otp);
        user.setOtpGeneratedTime(LocalDateTime.now());
        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), otp);
        log.info("Đã gửi lại OTP (mới) đến email: {}", user.getEmail());
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(String authorizationCode) {
        log.info("Bắt đầu xác thực Google OAuth với authorization code...");

        ClientRegistration googleRegistration = clientRegistrationRepository.findByRegistrationId("google");
        if (googleRegistration == null) {
            throw new IllegalStateException("Không tìm thấy cấu hình OAuth2 cho 'google'");
        }

        GoogleTokenResponse tokenResponse = exchangeCodeForToken(authorizationCode, googleRegistration);
        log.debug("Đã nhận access_token từ Google.");

        GoogleUserInfo userInfo = getGoogleUserInfo(tokenResponse.accessToken(), googleRegistration);
        log.debug("Đã lấy thông tin UserInfo từ Google, email user: {}", userInfo.email());

        if (!userInfo.emailVerified()) {
            throw new BadCredentialsException("Email Google chưa được xác thực.");
        }

        User user = userRepository.findByEmail(userInfo.email())
                .orElseGet(() -> createNewGoogleUser(userInfo));

        log.info("Đăng nhập/Đăng ký Google thành công cho: {}", user.getEmail());
        String accessToken = jwtTokenProvider.generateToken(user);
        return new AuthResponse(accessToken);
    }

    private GoogleTokenResponse exchangeCodeForToken(String code, ClientRegistration registration) {
        log.debug("Đang gửi request đến Google Token Endpoint...");
        
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("code", code);
        formData.add("client_id", registration.getClientId());
        formData.add("client_secret", registration.getClientSecret());
        formData.add("redirect_uri", googleRedirectUri); 
        formData.add("grant_type", "authorization_code");

        return webClientBuilder.build()
                .post()
                .uri(registration.getProviderDetails().getTokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(formData)
                .retrieve()
                .bodyToMono(GoogleTokenResponse.class)
                .doOnError(error -> log.error("Lỗi khi trao đổi code lấy token: {}", error.getMessage()))
                .block(); 
    }

    private GoogleUserInfo getGoogleUserInfo(String accessToken, ClientRegistration registration) {
        log.debug("Đang gửi request đến Google UserInfo Endpoint...");
        String userInfoUri = registration.getProviderDetails().getUserInfoEndpoint().getUri();
        
        return webClientBuilder.build()
                .get()
                .uri(userInfoUri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(GoogleUserInfo.class)
                .doOnError(error -> log.error("Lỗi khi lấy UserInfo từ Google: {}", error.getMessage()))
                .block();
    }

    private User createNewGoogleUser(GoogleUserInfo userInfo) {
        log.info("Tạo tài khoản mới từ Google cho email: {}", userInfo.email());
        User newUser = User.builder()
                .name(userInfo.name())
                .email(userInfo.email())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .isVerified(true) 
                .build();
        return userRepository.save(newUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        User authenticatedUser = getAuthenticatedUser();
        return UserResponse.fromEntity(authenticatedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findUserByEmail(String email) {
        log.info("Đang tìm người dùng bằng email (cho service nội bộ): {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND_MSG + email));
        return UserResponse.fromEntity(user);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadCredentialsException("Không có người dùng nào được xác thực");
        }
        String currentUserName = authentication.getName();
        if (currentUserName == null) {
            throw new IllegalStateException("Không thể xác định tên người dùng từ Security Context");
        }
        return userRepository.findByEmail(currentUserName)
                      .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng đã xác thực: " + currentUserName));
    }
    
    private String generateOtp() {
        return OTP_RANDOM.ints(100000, 999999)
                           .findFirst()
                           .getAsInt()
                           + "";
    }
}