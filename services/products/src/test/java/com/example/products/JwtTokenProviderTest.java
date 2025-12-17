package com.example.products;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.products.security.JwtTokenProvider;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {

    @InjectMocks
    private JwtTokenProvider tokenProvider;

    private String secretKey;
    private SecretKey key;

    @BeforeEach
    void setUp() {
        // Tạo một key hợp lệ (HMAC-SHA requires at least 256 bits)
        String rawKey = "verysecretkeyTestingForDevSecOpsProjectMustBeLongEnough123456";
        secretKey = Base64.getEncoder().encodeToString(rawKey.getBytes());
        
        // Inject property
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", secretKey);
        
        // Gọi init thủ công vì @PostConstruct không chạy trong unit test thuần
        tokenProvider.init();
        
        // Tạo key chuẩn để generate token giả trong test
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    private String generateToken(String username, Date expiration) {
        return Jwts.builder()
                .subject(username)
                .claim("roles", List.of("ROLE_USER"))
                .expiration(expiration)
                .signWith(key)
                .compact();
    }

    @Test
    @DisplayName("ValidateToken: Should return true for valid token")
    void validateToken_Valid() {
        String token = generateToken("user1", new Date(System.currentTimeMillis() + 10000)); // +10s
        assertThat(tokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("ValidateToken: Should return false for expired token")
    void validateToken_Expired() {
        String token = generateToken("user1", new Date(System.currentTimeMillis() - 1000)); // -1s
        assertThat(tokenProvider.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("ValidateToken: Should return false for malformed token")
    void validateToken_Malformed() {
        assertThat(tokenProvider.validateToken("invalid.token.here")).isFalse();
    }

    @Test
    @DisplayName("ValidateToken: Should return false for empty token")
    void validateToken_Empty() {
        assertThat(tokenProvider.validateToken("")).isFalse();
    }

    @Test
    @DisplayName("GetUsername: Should extract username")
    void getUsername_Success() {
        String token = generateToken("testUser", new Date(System.currentTimeMillis() + 10000));
        assertThat(tokenProvider.getUsername(token)).isEqualTo("testUser");
    }

    @Test
    @DisplayName("GetAuthorities: Should extract roles")
    void getAuthorities_Success() {
        String token = generateToken("testUser", new Date(System.currentTimeMillis() + 10000));
        Collection<? extends GrantedAuthority> authorities = tokenProvider.getAuthorities(token);
        
        assertThat(authorities).hasSize(1);
        assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_USER");
    }
}