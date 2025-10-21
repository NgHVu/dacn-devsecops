package com.example.users;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserServiceImpl;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl Tests")
class UserServiceImplTest {

    // === Mocks: Các thành phần phụ thuộc giả ===
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    // === Class Under Test: Tự động tiêm các Mocks ở trên vào ===
    @InjectMocks
    private UserServiceImpl userService;

    // === Argument Captor: Dùng để "bắt" đối số truyền vào mock ===
    @Captor
    private ArgumentCaptor<User> userArgumentCaptor;

    @Captor
    private ArgumentCaptor<UsernamePasswordAuthenticationToken> authRequestCaptor;

    // Thêm @AfterEach để dọn dẹp SecurityContextHolder
    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // === Test cho phương thức registerUser ===
    
    @Test
    @DisplayName("registerUser: Thành công khi email chưa tồn tại")
    void testRegisterUser_Success() {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        
        User savedUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .build();

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        UserResponse userResponse = userService.registerUser(request);

        // Assert (Kiểm tra kết quả trả về)
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.email()).isEqualTo("test@example.com");
        assertThat(userResponse.name()).isEqualTo("Test User");
        assertThat(userResponse.id()).isEqualTo(1L);

        // Dùng verify() để kiểm tra "Tác dụng phụ"
        verify(userRepository).save(userArgumentCaptor.capture());
        User userWasSaved = userArgumentCaptor.getValue();
        assertThat(userWasSaved.getEmail()).isEqualTo("test@example.com");
        assertThat(userWasSaved.getPassword()).isEqualTo("encodedPassword"); // Quan trọng: phải là pw đã mã hóa

        verify(passwordEncoder).encode("password123");
    }

    @Test
    @DisplayName("registerUser: Ném ra EmailAlreadyExistsException khi email đã tồn tại")
    void testRegisterUser_EmailAlreadyExists_ShouldThrowException() {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act & Assert
        EmailAlreadyExistsException exception = assertThrows(EmailAlreadyExistsException.class, () -> {
            userService.registerUser(request);
        });
        
        assertThat(exception.getMessage()).contains("Email 'test@example.com' đã được sử dụng");

        // Đảm bảo các hàm save và encode KHÔNG BAO GIỜ được gọi
        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    // === Test cho phương thức loginUser ===
    
    @Test
    @DisplayName("loginUser: Thành công khi thông tin đăng nhập chính xác")
    void testLoginUser_Success() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest("test@example.com", "password123");
        User user = User.builder().email("test@example.com").name("Test User").build();
        
        Authentication mockedAuthentication = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockedAuthentication);
        when(mockedAuthentication.getPrincipal()).thenReturn(user);
        when(jwtTokenProvider.generateToken(user)).thenReturn("dummy.jwt.token");

        // Act
        AuthResponse authResponse = userService.loginUser(loginRequest);

        // Assert (Kiểm tra kết quả)
        assertThat(authResponse).isNotNull();
        assertThat(authResponse.accessToken()).isEqualTo("dummy.jwt.token");

        // TỐI ƯU 3: Dùng ArgumentCaptor để đảm bảo gọi authenticate với ĐÚNG thông tin
        verify(authenticationManager).authenticate(authRequestCaptor.capture());
        UsernamePasswordAuthenticationToken authToken = authRequestCaptor.getValue();
        
        assertThat(authToken.getPrincipal()).isEqualTo("test@example.com");
        assertThat(authToken.getCredentials()).isEqualTo("password123");
        
        verify(jwtTokenProvider).generateToken(user);
    }

    // === Test cho phương thức loadUserByUsername (của UserDetailsService) ===
    
    @Test
    @DisplayName("loadUserByUsername: Thành công khi tìm thấy email")
    void testLoadUserByUsername_Success() {
        // Arrange
        String email = "test@example.com";
        User user = User.builder().email(email).password("encodedPassword").build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // Act
        UserDetails userDetails = userService.loadUserByUsername(email);

        // Assert
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo(email);
        assertThat(userDetails.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    @DisplayName("loadUserByUsername: Ném ra UsernameNotFoundException khi không tìm thấy email")
    void testLoadUserByUsername_NotFound_ShouldThrowException() {
        // Arrange
        String email = "notfound@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class, () -> {
            userService.loadUserByUsername(email);
        });
    }

    // === TỐI ƯU 4: Bổ sung Test cho getCurrentUser ===

    @Test
    @DisplayName("getCurrentUser: Thành công khi người dùng đã được xác thực")
    void testGetCurrentUser_Success() {
        // Arrange
        User user = User.builder().id(1L).email("test@example.com").name("Test User").build();
        
        // Giả lập SecurityContextHolder
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        
        when(authentication.getPrincipal()).thenReturn(user);

        // Act
        UserResponse userResponse = userService.getCurrentUser();

        // Assert
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.id()).isEqualTo(1L);
        assertThat(userResponse.email()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("getCurrentUser: Ném ra IllegalStateException khi không xác thực được người dùng")
    void testGetCurrentUser_UserNotAuthenticated_ShouldThrowException() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        
        when(authentication.getPrincipal()).thenReturn("anonymousUser"); // Giả lập trường hợp chưa đăng nhập

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            userService.getCurrentUser();
        });
    }
}

