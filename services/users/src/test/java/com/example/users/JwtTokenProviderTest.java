package com.example.users;

import com.example.users.entity.User;
import com.example.users.security.JwtTokenProvider;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SecurityException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication; // Thêm import này
import org.springframework.test.util.ReflectionTestUtils; // Import ReflectionTestUtils

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when; // Thêm import này

/**
 * Unit Test cho JwtTokenProvider.
 * Test này không cần @SpringBootTest, chỉ cần test logic Java thuần túy.
 */
@ExtendWith(MockitoExtension.class) // Kích hoạt Mockito
@DisplayName("JwtTokenProvider Tests")
class JwtTokenProviderTest {

    // Đối tượng thật cần test
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private Authentication authentication; // Mock Authentication

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
                .isVerified(true) // Đảm bảo user "enabled"
                .build();
    }

    @Test
    @DisplayName("generateToken(User): Tạo token thành công, không null hoặc rỗng")
    void testGenerateToken_ShouldCreateValidToken() {
        // Act
        String token = jwtTokenProvider.generateToken(testUser);

        // Assert
        assertThat(token).isNotNull().isNotEmpty();
    }

    // THÊM TEST CASE: Test hàm generateToken(Authentication)
    @Test
    @DisplayName("generateToken(Authentication): Tạo Token thành công")
    void testGenerateToken_FromAuthentication_Success() {
        // Arrange
        when(authentication.getName()).thenReturn("auth@example.com");

        // Act
        String token = jwtTokenProvider.generateToken(authentication);

        // Assert
        assertThat(token).isNotNull().isNotBlank();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo("auth@example.com");
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
        // 1. Tạo một provider khác với key khác
        JwtTokenProvider invalidProvider = new JwtTokenProvider();
        String differentSecret = "ZGlmZmVyZW50LXNlY3JldC1rZXktZGV2c2Vjb3BzLXByb2plY3QtbXVzdC1iZS1sb25nLWVub3VnaC1hbmQtc2VjdXJl";
        ReflectionTestUtils.setField(invalidProvider, "jwtSecret", differentSecret);
        ReflectionTestUtils.setField(invalidProvider, "jwtExpirationMs", testExpirationMs);
        invalidProvider.init();
        
        // 2. Tạo token bằng key SAU
        String token = invalidProvider.generateToken(testUser);

        // Act
        // 3. Kiểm tra token bằng key TRƯỚC
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Assert
        assertFalse(isValid);
        // Kiểm tra xem nó có ném đúng lỗi khi cố gắng giải mã không
        assertThrows(SecurityException.class, () -> {
            jwtTokenProvider.getUsernameFromToken(token); 
        });
    }

    // === SỬA LỖI SONARQUBE (Bỏ Thread.sleep) ===
    @Test
    @DisplayName("validateToken: Trả về false cho token hết hạn")
    void testValidateToken_ExpiredToken() { // Bỏ throws InterruptedException
        // Arrange
        // 1. "Tiêm" thời gian hết hạn là 1 mili-giây
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 1L);
        // (Không cần init() lại vì key không đổi)
        
        // 2. Tạo token (token này sẽ hết hạn ngay lập tức)
        String token = jwtTokenProvider.generateToken(testUser);

        // 3. BỎ: Không cần Thread.sleep() nữa
        // Thread.sleep(2); 

        // Act
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Assert
        assertFalse(isValid); // Token hết hạn nên phải là false
    }
    // === KẾT THÚC SỬA LỖI ===

    @Test
    @DisplayName("validateToken: Trả về false cho token bị định dạng sai")
    void testValidateToken_MalformedToken() {
        // Arrange
        String malformedToken = "đây.không.phải.token";

        // Act
        boolean isValid = jwtTokenProvider.validateToken(malformedToken);

        // Assert
        assertFalse(isValid);
        // Kiểm tra xem nó có ném đúng lỗi khi cố gắng giải mã không
        assertThrows(MalformedJwtException.class, () -> {
            jwtTokenProvider.getUsernameFromToken(malformedToken);
        });
    }
    
    @Test
    @DisplayName("validateToken: Trả về false khi Token rỗng hoặc null")
    void testValidateToken_EmptyOrNull() {
        // Act & Assert
        assertFalse(jwtTokenProvider.validateToken(null));
        assertFalse(jwtTokenProvider.validateToken(""));
    }
}