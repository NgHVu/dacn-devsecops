package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.dto.VerifyRequest;
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.security.SecureRandom; 
import java.util.Random;

@Service
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    private static final String USER_NOT_FOUND_MSG = "Không tìm thấy người dùng với email: ";

    private static final Random OTP_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    @Value("${app.otp.expiration-minutes:10}")
    private long otpExpirationMinutes;

    public UserServiceImpl(UserRepository userRepository,
                           @Lazy PasswordEncoder passwordEncoder,
                           @Lazy AuthenticationManager authenticationManager,
                           JwtTokenProvider jwtTokenProvider,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND_MSG + email));
    }

    @Override
    @Transactional
    public void registerUser(RegisterRequest registerRequest) {
        
        User user = userRepository.findByEmail(registerRequest.email())
                .orElse(new User());

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
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        // Nếu tài khoản đã được kích hoạt, không cần gửi lại
        if (user.isVerified()) {
            log.warn("Tài khoản {} đã được xác thực, không cần gửi lại OTP.", email);
            throw new IllegalStateException("Tài khoản này đã được kích hoạt.");
        }

        // Tạo OTP mới và cập nhật
        String otp = generateOtp();
        user.setVerificationOtp(otp);
        user.setOtpGeneratedTime(LocalDateTime.now());
        userRepository.save(user);

        // Gửi email bất đồng bộ
        emailService.sendOtpEmail(user.getEmail(), otp);
        log.info("Đã gửi lại OTP (mới) đến email: {}", user.getEmail());
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