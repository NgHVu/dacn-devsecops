package com.example.users.service;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.dto.VerifyRequest; // THÊM: DTO mới
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;

import lombok.extern.slf4j.Slf4j; // THÊM: Logger
import org.springframework.beans.factory.annotation.Value; // THÊM: @Value
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException; // THÊM
import org.springframework.security.authentication.DisabledException; // THÊM
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime; // THÊM
import java.util.Random; // THÊM
import java.util.Optional;

@Service
@Transactional
@Slf4j // THÊM: Kích hoạt Logger
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService; // THÊM: Tiêm EmailService

    @Value("${app.otp.expiration-minutes:10}") // THÊM: Tiêm giá trị từ application.properties
    private long otpExpirationMinutes;

    // SỬA: Cập nhật constructor để tiêm EmailService
    public UserServiceImpl(UserRepository userRepository,
                           @Lazy PasswordEncoder passwordEncoder,
                           @Lazy AuthenticationManager authenticationManager,
                           JwtTokenProvider jwtTokenProvider,
                           EmailService emailService) { // <-- THÊM
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService; // <-- THÊM
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // SỬA: Trả về chính Entity User (vì nó đã implements UserDetails)
        // Điều này cho phép Spring Security tự động kiểm tra user.isEnabled() (tức là isVerified)
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    @Override
    @Transactional
    public void registerUser(RegisterRequest registerRequest) { // SỬA: Trả về void
        
        // 1. Tìm user (nếu có) hoặc tạo mới
        User user = userRepository.findByEmail(registerRequest.email())
                .orElse(new User());

        // 2. Nếu user đã được xác thực, báo lỗi email đã tồn tại
        if (user.isVerified()) {
            log.warn("Email đã tồn tại và đã xác thực: {}", registerRequest.email());
            throw new EmailAlreadyExistsException("Email '" + registerRequest.email() + "' đã được sử dụng");
        }
        
        // 3. Cập nhật thông tin user, tạo OTP
        String encodedPassword = passwordEncoder.encode(registerRequest.password());
        String otp = generateOtp();

        user.setName(registerRequest.name());
        user.setEmail(registerRequest.email());
        user.setPassword(encodedPassword);
        user.setVerificationOtp(otp);
        user.setOtpGeneratedTime(LocalDateTime.now());
        user.setVerified(false); // Đảm bảo trạng thái là chưa xác thực
        
        userRepository.save(user);

        // 4. Gửi Email (bất đồng bộ)
        emailService.sendOtpEmail(user.getEmail(), otp);
        log.info("Đã lưu user và gửi OTP đến email: {}", user.getEmail());
    }

    // THÊM: Phương thức xác thực OTP
    @Override
    @Transactional
    public AuthResponse verifyAccount(VerifyRequest verifyRequest) {
        log.info("Đang xác thực OTP cho email: {}", verifyRequest.email());
        User user = userRepository.findByEmail(verifyRequest.email())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + verifyRequest.email()));

        // 1. Kiểm tra tài khoản đã được kích hoạt chưa
        if (user.isVerified()) {
            throw new IllegalStateException("Tài khoản đã được xác thực trước đó.");
        }

        // 2. Kiểm tra OTP hết hạn
        if (user.getOtpGeneratedTime().plusMinutes(otpExpirationMinutes).isBefore(LocalDateTime.now())) {
            log.warn("Mã OTP đã hết hạn cho email: {}", verifyRequest.email());
            // (Tùy chọn: có thể tạo và gửi lại OTP mới)
            throw new BadCredentialsException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // 3. Kiểm tra mã OTP
        if (!user.getVerificationOtp().equals(verifyRequest.otp())) {
            log.warn("Mã OTP không chính xác cho email: {}", verifyRequest.email());
            throw new BadCredentialsException("Mã OTP không chính xác.");
        }

        // 4. Xác thực thành công! Cập nhật user
        user.setVerified(true);
        user.setVerificationOtp(null); // Xóa OTP sau khi dùng
        user.setOtpGeneratedTime(null);
        userRepository.save(user);

        log.info("Xác thực tài khoản thành công cho email: {}", user.getEmail());

        // 5. Tạo token và trả về (y hệt hàm login)
        // Tạo Authentication object thủ công vì đây là lần đầu
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
            // 1. Xác thực (email, pass) VÀ kiểm tra isEnabled() (tức là isVerified)
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.email(),
                            loginRequest.password()
                    )
            );
            // Nếu code chạy đến đây, user đã hợp lệ VÀ đã được xác thực OTP

            // 2. Đặt vào Context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. Lấy User entity từ principal (vì loadUserByUsername trả về User)
            User user = (User) authentication.getPrincipal();
            
            // 4. Tạo token
            String accessToken = jwtTokenProvider.generateToken(user);
            return new AuthResponse(accessToken);

        } catch (DisabledException e) {
            // Lỗi này xảy ra khi user.isEnabled() trả về false (chưa xác thực)
            log.warn("Đăng nhập thất bại: Tài khoản chưa được kích hoạt cho email: {}", loginRequest.email());
            throw new BadCredentialsException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực OTP.");
        } catch (BadCredentialsException e) {
            // Lỗi này xảy ra khi sai email hoặc mật khẩu
            log.warn("Đăng nhập thất bại: Sai thông tin đăng nhập cho email: {}", loginRequest.email());
            throw new BadCredentialsException("Thông tin đăng nhập không chính xác.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        User authenticatedUser = getAuthenticatedUser();
        return UserResponse.fromEntity(authenticatedUser);
    }

    // SỬA: Trả về DTO thay vì Entity (để khớp interface mới)
    @Override
    @Transactional(readOnly = true)
    public UserResponse findUserByEmail(String email) {
        log.info("Đang tìm người dùng bằng email (cho service nội bộ): {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));
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

    // THÊM: Hàm helper tạo OTP
    private String generateOtp() {
        // Tạo số ngẫu nhiên 6 chữ số (từ 100000 đến 999999)
        return new Random().ints(100000, 999999)
                       .findFirst()
                       .getAsInt()
                       + ""; // Chuyển sang String
    }
}