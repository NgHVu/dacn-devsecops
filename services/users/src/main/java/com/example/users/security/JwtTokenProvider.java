package com.example.users.security;

import com.example.users.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException; 
import jakarta.annotation.PostConstruct; 
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret-key}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey key;

    /**
     * Phương thức này sẽ tự động chạy một lần duy nhất sau khi bean được khởi tạo.
     * Nó tạo ra đối tượng SecretKey và lưu lại để tái sử dụng, giúp tăng hiệu năng.
     */
    @PostConstruct
    public void init() {
        byte[] keyBytes = Decoders.BASE64.decode(this.jwtSecret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

     // Tạo ra một access token JWT cho người dùng.
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(this.key) 
                .compact();
    }

    
     // Trích xuất email của người dùng từ một token JWT.
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(this.key) 
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    
     // Kiểm tra xem một token JWT có hợp lệ hay không.
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(this.key) 
                    .build()
                    .parse(token);
            return true;
        } catch (SecurityException | MalformedJwtException ex) { // Gộp các exception tương tự
            logger.error("Token JWT không hợp lệ: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Token JWT đã hết hạn: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Token JWT không được hỗ trợ: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("Chuỗi claims của JWT rỗng: {}", ex.getMessage());
        }
        return false;
    }

}
