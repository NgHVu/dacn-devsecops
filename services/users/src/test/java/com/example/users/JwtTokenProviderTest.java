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
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils; // <-- Import ReflectionTestUtils

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Unit Test cho JwtTokenProvider.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtTokenProvider Tests")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private Authentication authentication;

    private User testUser;
    
    // Một khóa bí mật base64 hợp lệ, đủ dài
    private final String testSecretKey = "bXktc2VjcmV0LWtleS1mb3ItZGV2c2Vjb3BzLXRlc3RpbmctcHVycG9zZXMtYmV5b25kLXNhbXBsZQ==";
    private final long testExpirationMs = 60000; // 1 phút

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testSecretKey);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", testExpirationMs);
        
        jwtTokenProvider.init();

        testUser = User.builder()
                .email("test@example.com")
                .name("Test User")
                .isVerified(true)
                .build();
    }

    @Test
    @DisplayName("generateToken(User): Tạo token thành công")
    void testGenerateToken_FromUser_Success() {
        String token = jwtTokenProvider.generateToken(testUser);
        assertThat(token).isNotNull().isNotEmpty();
    }

    // SỬA LỖI BIÊN DỊCH: Test này giờ đã chạy được
    @Test
    @DisplayName("generateToken(Authentication): Tạo Token thành công")
    void testGenerateToken_FromAuthentication_Success() {
        when(authentication.getName()).thenReturn("auth@example.com");
        String token = jwtTokenProvider.generateToken(authentication);
        assertThat(token).isNotNull().isNotBlank();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo("auth@example.com");
    }

    @Test
    @DisplayName("getUsernameFromToken: Trích xuất đúng email")
    void testGetUsernameFromToken_ShouldReturnCorrectEmail() {
        String token = jwtTokenProvider.generateToken(testUser);
        String usernameFromToken = jwtTokenProvider.getUsernameFromToken(token);
        assertThat(usernameFromToken).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("validateToken: Trả về true cho token hợp lệ")
    void testValidateToken_ValidToken() {
        String token = jwtTokenProvider.generateToken(testUser);
        boolean isValid = jwtTokenProvider.validateToken(token);
        assertTrue(isValid);
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token giả mạo (sai chữ ký)")
    void testValidateToken_InvalidSignature() {
        // 1. Tạo provider với key khác
        JwtTokenProvider invalidProvider = new JwtTokenProvider();
        String differentSecret = "ZGlmZmVyZW50LXNlY3JldC1rZXktZGV2c2Vjb3BzLXByb2plY3QtbXVzdC1iZS1sb25nLWVub3VnaC1hbmQtc2VjdXJl";
        ReflectionTestUtils.setField(invalidProvider, "jwtSecret", differentSecret);
        ReflectionTestUtils.setField(invalidProvider, "jwtExpirationMs", testExpirationMs);
        invalidProvider.init();
        
        // 2. Tạo token bằng key SAU
        String token = invalidProvider.generateToken(testUser);

        // 3. Kiểm tra token bằng key TRƯỚC
        boolean isValid = jwtTokenProvider.validateToken(token);

        assertFalse(isValid);
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
        
        // 2. Tạo token (token này sẽ hết hạn ngay lập tức)
        String token = jwtTokenProvider.generateToken(testUser);

        // 3. BỎ: Không cần Thread.sleep() nữa
        // Thread.sleep(2); 

        // Act
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Assert
        assertFalse(isValid); // Token hết hạn nên phải là false
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token bị định dạng sai")
    void testValidateToken_MalformedToken() {
        String malformedToken = "đây.không.phải.token";
        boolean isValid = jwtTokenProvider.validateToken(malformedToken);
        assertFalse(isValid);
        assertThrows(MalformedJwtException.class, () -> {
            jwtTokenProvider.getUsernameFromToken(malformedToken);
        });
    }
    
    @Test
    @DisplayName("validateToken: Trả về false khi Token rỗng hoặc null")
    void testValidateToken_EmptyOrNull() {
        assertFalse(jwtTokenProvider.validateToken(null));
        assertFalse(jwtTokenProvider.validateToken(""));
    }
}