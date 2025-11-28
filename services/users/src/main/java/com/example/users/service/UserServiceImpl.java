package com.example.users.service;

import com.example.users.exception.ResourceNotFoundException;
import com.example.users.dto.*;
import com.example.users.entity.User;
import com.example.users.entity.Role;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;         
import org.springframework.data.domain.Pageable;     
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
import org.springframework.util.StringUtils;         
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;                      
import java.nio.file.Files;                   
import java.nio.file.Path;                            
import java.nio.file.Paths;                           
import java.nio.file.StandardCopyOption;             
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${app.otp.expiration-minutes:3}")
    private long otpExpirationMinutes;
    @Value("${app.oauth.google.redirect-uri}")
    private String googleRedirectUri;
    private static final Random OTP_RANDOM = new SecureRandom();
    private static final String USER_NOT_FOUND_MSG_TPL = "Email '%s' chưa được đăng ký.";
    private static final long RESET_TOKEN_EXPIRATION_MINUTES = 15;

    public UserServiceImpl(UserRepository userRepository,
                           @Lazy PasswordEncoder passwordEncoder,
                           @Lazy AuthenticationManager authenticationManager,
                           JwtTokenProvider jwtTokenProvider,
                           EmailService emailService,
                           @Lazy ClientRegistrationRepository clientRegistrationRepository,
                           @Lazy WebClient.Builder webClientBuilder,
                           ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.webClientBuilder = webClientBuilder;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));
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
        user.setRole(Role.ROLE_USER);
        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), otp);
        log.info("Đã lưu user và gửi OTP đến email: {}", user.getEmail());
    }

    @Override
    @Transactional
    public AuthResponse verifyAccount(VerifyRequest verifyRequest) {
        log.info("Đang xác thực OTP cho email: {}", verifyRequest.email());
        
        User user = userRepository.findByEmail(verifyRequest.email())
                .orElseThrow(() -> new ResourceNotFoundException(String.format(USER_NOT_FOUND_MSG_TPL, verifyRequest.email())));

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
        
        String accessToken = jwtTokenProvider.generateToken(authentication);

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
            
            String accessToken = jwtTokenProvider.generateToken(authentication);
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
                .orElseThrow(() -> new ResourceNotFoundException(String.format(USER_NOT_FOUND_MSG_TPL, email)));

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
        
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities()
        );

        String accessToken = jwtTokenProvider.generateToken(authentication);

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
                .role(Role.ROLE_USER) 
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
                .orElseThrow(() -> new ResourceNotFoundException(String.format(USER_NOT_FOUND_MSG_TPL, email)));
        
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

    @Override
    @Transactional
    public void processForgotPassword(String email) {
        log.info("Xử lý yêu cầu quên mật khẩu cho email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(USER_NOT_FOUND_MSG_TPL, email)));

        if (!user.isVerified()) {
            log.warn("Yêu cầu reset mật khẩu cho tài khoản chưa xác thực: {}", email);
            throw new BadCredentialsException("Tài khoản này chưa được xác thực, không thể reset mật khẩu.");
        }

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRATION_MINUTES));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
        log.info("Đã tạo token reset và gửi email cho: {}", email);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Đang xử lý reset mật khẩu với token: {}", token);

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new BadCredentialsException("Link này không hợp lệ hoặc đã được sử dụng. Vui lòng yêu cầu link mới."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            log.warn("Token reset mật khẩu đã hết hạn cho user: {}", user.getEmail());
            user.setResetPasswordToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new BadCredentialsException("Link này đã hết hạn. Vui lòng yêu cầu link mới.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));

        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);

        userRepository.save(user);
        log.info("Reset mật khẩu thành công cho user: {}", user.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public void validateResetToken(String token) {
        log.info("Đang kiểm tra tính hợp lệ của token: {}", token);

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new BadCredentialsException("Link này không hợp lệ hoặc đã được sử dụng. Vui lòng yêu cầu link mới."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            log.warn("Token reset mật khẩu đã hết hạn (khi kiểm tra): {}", user.getEmail());
            throw new BadCredentialsException("Link này đã hết hạn. Vui lòng yêu cầu link mới.");
        }

        log.info("Token hợp lệ cho user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = getAuthenticatedUser();
        
        if (StringUtils.hasText(request.name())) {
            user.setName(request.name().trim());
        }
        if (StringUtils.hasText(request.phoneNumber())) {
            user.setPhoneNumber(request.phoneNumber().trim());
        }
        if (StringUtils.hasText(request.address())) {
            user.setAddress(request.address().trim());
        }
        
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new BadCredentialsException("Mật khẩu cũ không chính xác");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadCredentialsException("Mật khẩu xác nhận không khớp");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Người dùng ID {} đã đổi mật khẩu thành công", user.getId());
    }

    @Override
    @Transactional
    public String uploadAvatar(MultipartFile file) {
        User user = getAuthenticatedUser();

        if (file.isEmpty()) {
            throw new RuntimeException("File ảnh không được để trống");
        }

        try {
            String fileName = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            Path uploadPath = Paths.get("uploads/avatars");
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            
            String fileUrl = "/uploads/avatars/" + fileName; 
            
            user.setAvatar(fileUrl);
            userRepository.save(user);
            
            return fileUrl;
        } catch (IOException e) {
            log.error("Lỗi khi upload avatar", e);
            throw new RuntimeException("Không thể upload ảnh, vui lòng thử lại sau.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public void lockUser(Long id, boolean lock) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        
        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new IllegalArgumentException("Không thể khóa tài khoản Quản trị viên (Admin).");
        }

        user.setAccountNonLocked(!lock);
        userRepository.save(user);
        
        log.info("Admin đã {} tài khoản user ID: {}", lock ? "KHÓA" : "MỞ KHÓA", id);
    }
}