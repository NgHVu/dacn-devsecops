package com.example.users;

import com.example.users.security.JwtTokenProvider;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SecurityException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import io.jsonwebtoken.Jwts;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtTokenProvider Tests (RBAC)")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private Authentication authentication;

    private final String testSecretKey = "bXktc2VjcmV0LWtleS1mb3ItZGV2c2Vjb3BzLXRlc3RpbmctcHVycG9zZXMtYmV5b25kLXNhbXBsZQ==";
    private final long testExpirationMs = 60000;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testSecretKey);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", testExpirationMs);
        jwtTokenProvider.init();
        
        // FIX: Không mock Authentication ở đây để tránh lỗi UnnecessaryStubbing
        // Các test case validation không cần authentication sẽ bị lỗi nếu để ở đây.
    }

    @Test
    @DisplayName("generateToken(Authentication): Tạo Token thành công và chứa roles")
    void testGenerateToken_FromAuthentication_Success() {
        // Setup mock chỉ cho test case này
        when(authentication.getName()).thenReturn("test@example.com");
        Collection<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_USER"),
                new SimpleGrantedAuthority("ROLE_ADMIN")
        );
        doReturn(authorities).when(authentication).getAuthorities();

        String token = jwtTokenProvider.generateToken(authentication);

        assertThat(token).isNotNull().isNotBlank();
        assertThat(jwtTokenProvider.getUsername(token)).isEqualTo("test@example.com");

        Collection<? extends GrantedAuthority> actualAuthorities = jwtTokenProvider.getAuthorities(token);
        var roleNames = actualAuthorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        assertThat(roleNames).containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
    }

    @Test
    @DisplayName("getUsername: Trích xuất đúng email (username)")
    void testGetUsername_ShouldReturnCorrectEmail() {
        // Cần mock để tạo token hợp lệ trước
        when(authentication.getName()).thenReturn("test@example.com");
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_USER"))).when(authentication).getAuthorities();

        String token = jwtTokenProvider.generateToken(authentication);
        String usernameFromToken = jwtTokenProvider.getUsername(token);
        
        assertThat(usernameFromToken).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("getAuthorities: Trích xuất đúng danh sách Roles")
    void testGetAuthorities_ShouldReturnCorrectRoles() {
        // Setup mock
        when(authentication.getName()).thenReturn("test@example.com");
        Collection<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_USER"),
                new SimpleGrantedAuthority("ROLE_ADMIN")
        );
        doReturn(authorities).when(authentication).getAuthorities();

        String token = jwtTokenProvider.generateToken(authentication);
        Collection<? extends GrantedAuthority> extractedAuthorities = jwtTokenProvider.getAuthorities(token);

        assertThat(extractedAuthorities).isNotNull().hasSize(2);
        var roleNames = extractedAuthorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        assertThat(roleNames).containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
    }

    @Test
    @DisplayName("getAuthorities: Trả về danh sách rỗng khi token không có roles")
    void testGetAuthorities_WhenRolesAreEmpty() {
        // Setup mock trả về list rỗng
        when(authentication.getName()).thenReturn("test@example.com");
        doReturn(List.of()).when(authentication).getAuthorities();
        
        String token = jwtTokenProvider.generateToken(authentication);
        Collection<? extends GrantedAuthority> authorities = jwtTokenProvider.getAuthorities(token);

        assertThat(authorities).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("getAuthorities: Trả về danh sách rỗng khi claim 'roles' là null")
    void testGetAuthorities_WhenRolesClaimIsNull() {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + testExpirationMs);
        SecretKey key = (SecretKey) ReflectionTestUtils.getField(jwtTokenProvider, "key");
        
        String tokenWithNullRoles = Jwts.builder()
                .subject("test@example.com")
                .claim("roles", null) 
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();

        Collection<? extends GrantedAuthority> authorities = jwtTokenProvider.getAuthorities(tokenWithNullRoles);
        assertThat(authorities).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("validateToken: Trả về true cho token hợp lệ")
    void testValidateToken_ValidToken() {
        when(authentication.getName()).thenReturn("test@example.com");
        doReturn(List.of()).when(authentication).getAuthorities();

        String token = jwtTokenProvider.generateToken(authentication); 
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token giả mạo (sai chữ ký)")
    void testValidateToken_InvalidSignature() {
        // Tạo token bằng key khác
        JwtTokenProvider invalidProvider = new JwtTokenProvider();
        String differentSecret = "ZGlmZmVyZW50LXNlY3JldC1rZXktZGV2c2Vjb3BzLXByb2plY3QtbXVzdC1iZS1sb25nLWVub3VnaC1hbmQtc2VjdXJl";
        ReflectionTestUtils.setField(invalidProvider, "jwtSecret", differentSecret);
        ReflectionTestUtils.setField(invalidProvider, "jwtExpirationMs", testExpirationMs);
        invalidProvider.init();

        // Mock authentication cho provider giả
        when(authentication.getName()).thenReturn("hacker@example.com");
        doReturn(List.of()).when(authentication).getAuthorities();

        String token = invalidProvider.generateToken(authentication); 

        // Validate bằng provider thật
        assertFalse(jwtTokenProvider.validateToken(token));
        
        assertThrows(SecurityException.class, () -> jwtTokenProvider.getUsername(token));
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token hết hạn")
    void testValidateToken_ExpiredToken() {
        // Mock authentication
        when(authentication.getName()).thenReturn("test@example.com");
        doReturn(List.of()).when(authentication).getAuthorities();

        // Set thời gian hết hạn cực ngắn
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 1L);
        String token = jwtTokenProvider.generateToken(authentication); 

        // Sleep 2ms để chắc chắn token hết hạn
        try { Thread.sleep(2); } catch (InterruptedException e) {}

        assertFalse(jwtTokenProvider.validateToken(token)); 
        assertThrows(ExpiredJwtException.class, () -> jwtTokenProvider.getUsername(token));
    }

    @Test
    @DisplayName("validateToken: Trả về false cho token bị định dạng sai")
    void testValidateToken_MalformedToken() {
        String malformedToken = "đây.không.phải.token";
        assertFalse(jwtTokenProvider.validateToken(malformedToken));
        assertThrows(MalformedJwtException.class, () -> jwtTokenProvider.getUsername(malformedToken));
    }

    @Test
    @DisplayName("validateToken: Trả về false khi Token rỗng hoặc null")
    void testValidateToken_EmptyOrNull() {
        assertFalse(jwtTokenProvider.validateToken(null));
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken(" "));
    }
}