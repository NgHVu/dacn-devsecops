package com.example.products.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    private static final String ROLES_CLAIM = "roles";

    @Value("${app.jwt.secret-key}")
    private String jwtSecret;

    private SecretKey key;

    @PostConstruct
    public void init() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(this.jwtSecret);
            this.key = Keys.hmacShaKeyFor(keyBytes);
            log.info("Khởi tạo JWT Secret Key thành công.");
        } catch (IllegalArgumentException e) {
            log.error("Lỗi khởi tạo JWT Key: {}", e.getMessage());
        }
    }

    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Collection<? extends GrantedAuthority> getAuthorities(String token) {
        Claims claims = parseClaims(token);
        
        // Sử dụng helper method để cast an toàn hơn và hạn chế phạm vi @SuppressWarnings
        List<String> roles = getRolesFromClaims(claims);

        if (roles.isEmpty()) {
            return Collections.emptyList();
        }

        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<String> getRolesFromClaims(Claims claims) {
        List<?> rawRoles = claims.get(ROLES_CLAIM, List.class);
        if (rawRoles == null) {
            return Collections.emptyList();
        }
        // Trong thực tế, JJWT đảm bảo list trả về đúng type nếu được sign đúng,
        // nhưng check instanceOf là thói quen tốt nếu cần strict safety.
        // Ở đây ta tin tưởng token nội bộ nên cast trực tiếp.
        return (List<String>) rawRoles;
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.error("Token JWT không hợp lệ: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("Token JWT đã hết hạn: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Token JWT không được hỗ trợ: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("Chuỗi JWT rỗng: {}", ex.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(this.key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}