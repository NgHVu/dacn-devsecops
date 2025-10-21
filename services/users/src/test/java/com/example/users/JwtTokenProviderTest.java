package com.example.users;

import com.example.users.entity.User;
import com.example.users.security.JwtTokenProvider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("JwtTokenProvider Tests")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private User testUser;
    
    // Một khóa bí mật base64 hợp lệ, đủ dài cho thuật toán
    private final String testSecretKey = "bXktc2VjcmV0LWtleS1mb3ItZGV2c2Vjb3BzLXRlc3RpbmctcHVycG9zZXMtYmV5b25kLXNhbXBsZQ==";
    private final long testExpirationMs = 60000; // 1 phút

    @BeforeEach
    void setUp() {
        // Khởi tạo JwtTokenProvider thủ công để test
        jwtTokenProvider = new JwtTokenProvider();
        
        // Sử dụng ReflectionTestUtils để "tiêm" các giá trị @Value vào
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testSecretKey);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", testExpirationMs);
        
        // Chạy phương thức @PostConstruct thủ công
        jwtTokenProvider.init();

        // Tạo một user mẫu
        testUser = User.builder()
                .email("test@example.com")
                .name("Test User")
                .build();
    }

    @Test
    @DisplayName("generateToken: Tạo token thành công, không null hoặc rỗng")
    void testGenerateToken_ShouldCreateValidToken() {
        // Act
        String token = jwtTokenProvider.generateToken(testUser);

        // Assert
        assertThat(token).isNotNull().isNotEmpty();
    }

    @Test
    @DisplayName("getUsernameFromToken: Trích xuất đúng email từ token hợp lệ")
    void testGetUsernameFromToken_ShouldReturnCorrectEmail() {
        // Arrange
        String token = jwtTokenProvider.generateToken(testUser);
        
        // Act
        String usernameFromToken = jwtTokenProvider.getUsernameFromToken(token);
        
        // Assert
        assertThat(usernameFromToken).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("validateToken: Trả về true cho token hợp lệ")
    void testValidateToken_ValidToken() {
        // Arrange
        String token = jwtTokenProvider.generateToken(testUser);

        // Act
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Assert
        assertTrue(isValid);
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token giả mạo (sai chữ ký)")
    void testValidateToken_InvalidSignature() {
        // Arrange
        String token = jwtTokenProvider.generateToken(testUser);
        String tamperedToken = token.substring(0, token.length() - 1) + "X";

        // Act
        boolean isValid = jwtTokenProvider.validateToken(tamperedToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token hết hạn")
    void testValidateToken_ExpiredToken() throws InterruptedException {
        // Arrange
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 1L);
        jwtTokenProvider.init();
        String token = jwtTokenProvider.generateToken(testUser);
        Thread.sleep(2); // Đợi 2ms để token chắc chắn hết hạn

        // Act
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Assert
        assertFalse(isValid);
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token bị định dạng sai")
    void testValidateToken_MalformedToken() {
        // Arrange
        String malformedToken = "đây.không.phải.token";

        // Act
        boolean isValid = jwtTokenProvider.validateToken(malformedToken);

        // Assert
        assertFalse(isValid);
    }
}

