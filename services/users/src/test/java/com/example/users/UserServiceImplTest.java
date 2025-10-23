package com.example.users;

import com.example.users.dto.AuthResponse;
import com.example.users.dto.LoginRequest;
import com.example.users.dto.RegisterRequest;
import com.example.users.dto.UserResponse;
import com.example.users.entity.User;
import com.example.users.exception.EmailAlreadyExistsException;
import com.example.users.repository.UserRepository;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserServiceImpl; // Import implementation
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class) // Sử dụng MockitoExtension để quản lý mocks
@DisplayName("UserServiceImpl Tests")
// Bỏ "implements UserService" vì đây là class test
class UserServiceImplTest {

    // Đối tượng cần test, Mockito sẽ tự inject các @Mock vào đây
    @InjectMocks
    private UserServiceImpl userService;

    // Các dependency cần mock
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    // Mock cho SecurityContext để giả lập người dùng đăng nhập
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;


    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        // Thiết lập SecurityContextHolder để sử dụng mock context
        // Quan trọng: Phải clear context trước mỗi test để tránh ảnh hưởng lẫn nhau
        SecurityContextHolder.clearContext();

        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .build();

        registerRequest = new RegisterRequest("Test User", "test@example.com", "password123");
        loginRequest = new LoginRequest("test@example.com", "password123");
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
        assertThat(userDetails.getPassword()).isEqualTo("encodedPassword");
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    @DisplayName("loadUserByUsername: Ném UsernameNotFoundException khi không tìm thấy user")
    void testLoadUserByUsername_UserNotFound() {
        // Arrange
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class, () -> {
            userService.loadUserByUsername("notfound@example.com");
        });
        verify(userRepository).findByEmail("notfound@example.com");
    }


    // --- Test cho registerUser ---
    @Test
    @DisplayName("registerUser: Thành công khi email chưa tồn tại")
    void testRegisterUser_Success() {
        // Arrange
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.password())).thenReturn("encodedPassword");
        // Giả lập việc save trả về User có ID
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User userToSave = invocation.getArgument(0);
            userToSave.setId(1L); // Gán ID giả lập
            return userToSave;
        });


        // Act
        UserResponse userResponse = userService.registerUser(registerRequest);

        // Assert
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.id()).isEqualTo(1L);
        assertThat(userResponse.email()).isEqualTo(registerRequest.email());
        assertThat(userResponse.name()).isEqualTo(registerRequest.name());
        verify(userRepository).existsByEmail(registerRequest.email());
        verify(passwordEncoder).encode(registerRequest.password());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("registerUser: Ném EmailAlreadyExistsException khi email đã tồn tại")
    void testRegisterUser_EmailAlreadyExists() {
        // Arrange
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(true);

        // Act & Assert
        assertThrows(EmailAlreadyExistsException.class, () -> {
            userService.registerUser(registerRequest);
        });
        verify(userRepository).existsByEmail(registerRequest.email());
        // Đảm bảo không gọi encode hay save
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }


    // --- Test cho loginUser ---
    @Test
    @DisplayName("loginUser: Thành công khi thông tin đăng nhập đúng")
    void testLoginUser_Success() {
        // Arrange
        // Giả lập AuthenticationManager trả về đối tượng Authentication đã xác thực
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password());
        when(authenticationManager.authenticate(authToken)).thenReturn(authentication); // Sử dụng mock authentication
        when(authentication.getName()).thenReturn(loginRequest.email()); // Giả lập getName() trả về email

        // Giả lập userRepository trả về User entity khi được gọi sau khi xác thực
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(testUser));

        // Giả lập JwtTokenProvider tạo token
        when(jwtTokenProvider.generateToken(testUser)).thenReturn("dummy.jwt.token");

        // Act
        AuthResponse authResponse = userService.loginUser(loginRequest);

        // Assert
        assertThat(authResponse).isNotNull();
        assertThat(authResponse.accessToken()).isEqualTo("dummy.jwt.token");
        // Kiểm tra xem SecurityContextHolder có được set không (không bắt buộc nhưng nên có)
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isEqualTo(authentication);

        verify(authenticationManager).authenticate(authToken);
        verify(userRepository).findByEmail(loginRequest.email());
        verify(jwtTokenProvider).generateToken(testUser);
    }

     @Test
     @DisplayName("loginUser: Ném Exception khi AuthenticationManager thất bại")
     void testLoginUser_AuthenticationFailure() {
         // Arrange
         UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(loginRequest.email(), "wrongpassword");
         // Giả lập AuthenticationManager ném exception (ví dụ: BadCredentialsException)
         when(authenticationManager.authenticate(authToken))
                 .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Bad credentials"));

         // Act & Assert
         assertThrows(org.springframework.security.authentication.BadCredentialsException.class, () -> {
             userService.loginUser(new LoginRequest(loginRequest.email(), "wrongpassword"));
         });

         // Đảm bảo các bước sau không được gọi
         verify(userRepository, never()).findByEmail(anyString());
         verify(jwtTokenProvider, never()).generateToken(any(User.class));
         // Kiểm tra SecurityContextHolder không bị thay đổi
         assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
     }


    // --- Test cho getCurrentUser ---
    @Test
    @DisplayName("getCurrentUser: Thành công khi người dùng đã xác thực")
    void testGetCurrentUser_Success() {
        // Arrange
        // Giả lập SecurityContextHolder có chứa Authentication
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);

        // Mock authentication.getName() để trả về username mong muốn
        when(authentication.getName()).thenReturn(testUser.getEmail());

        // Giả lập userRepository trả về User entity khi được gọi bởi getAuthenticatedUser
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));


        // Act
        UserResponse userResponse = userService.getCurrentUser();

        // Assert
        assertThat(userResponse).isNotNull();
        assertThat(userResponse.id()).isEqualTo(testUser.getId());
        assertThat(userResponse.email()).isEqualTo(testUser.getEmail());
        assertThat(userResponse.name()).isEqualTo(testUser.getName());

        verify(securityContext).getAuthentication();
        verify(authentication).isAuthenticated();
        // Xác minh gọi getName()
        verify(authentication).getName();
        verify(userRepository).findByEmail(testUser.getEmail());
    }

    @Test
    @DisplayName("getCurrentUser: Ném IllegalStateException khi người dùng chưa xác thực")
    void testGetCurrentUser_UserNotAuthenticated_ShouldThrowException() {
        // Arrange
        // Giả lập SecurityContextHolder trả về null authentication hoặc unauthenticated
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null);

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            userService.getCurrentUser();
        }, "Không có người dùng nào được xác thực"); // Kiểm tra message lỗi nếu cần

        verify(securityContext).getAuthentication();
    }


    // --- Test cho findByEmail ---
     @Test
     @DisplayName("findByEmail: Trả về Optional chứa User khi tìm thấy")
     void testFindByEmail_UserFound() {
         // Arrange
         when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

         // Act
         Optional<User> foundUser = userService.findByEmail("test@example.com");

         // Assert
         assertThat(foundUser).isPresent().contains(testUser);
         verify(userRepository).findByEmail("test@example.com");
     }

     @Test
     @DisplayName("findByEmail: Trả về Optional rỗng khi không tìm thấy")
     void testFindByEmail_UserNotFound() {
         // Arrange
         when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

         // Act
         Optional<User> foundUser = userService.findByEmail("notfound@example.com");

         // Assert
         assertThat(foundUser).isNotPresent();
         verify(userRepository).findByEmail("notfound@example.com");
     }
}

