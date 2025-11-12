package com.example.orders.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
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

    @PostConstruct
    public void init() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(this.jwtSecret);
            this.key = Keys.hmacShaKeyFor(keyBytes);
            logger.info("Khởi tạo JWT Secret Key thành công.");
        } catch (IllegalArgumentException e) {
            logger.error("Lỗi khi decode JWT Secret Key Base64: {}. Key có thể không hợp lệ hoặc quá ngắn.", e.getMessage());
        }
    }

    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(this.key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(this.key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(this.key)
                    .build()
                    .parse(token);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            logger.error("Token JWT không hợp lệ: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Token JWT đã hết hạn: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Token JWT không được hỗ trợ: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("Chuỗi JWT không hợp lệ hoặc rỗng: {}", ex.getMessage());
        }
        return false;
    }
}