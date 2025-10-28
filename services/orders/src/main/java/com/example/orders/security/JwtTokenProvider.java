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

/**
 * Utility class để xử lý các thao tác liên quan đến JSON Web Tokens (JWT). 
 * Bao gồm tạo token, lấy thông tin từ token và kiểm tra tính hợp lệ của token.
 */
@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret-key}") // Lấy secret key từ application.properties
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}") // Lấy thời gian hết hạn từ application.properties
    private long jwtExpirationMs;

    private SecretKey key; // Key để ký và xác thực token

    /**
     * Khởi tạo SecretKey một lần sau khi bean được tạo.
     * Chuyển đổi secret key dạng Base64 thành đối tượng SecretKey.
     */
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

    /**
     * Tạo ra một access token JWT từ thông tin Authentication (sau khi user đăng nhập thành công).
     *
     * @param authentication Đối tượng Authentication chứa thông tin người dùng đã xác thực.
     * @return Chuỗi JWT access token.
     */
    public String generateToken(Authentication authentication) {
        // Lấy username (thường là email) từ principal
        String username = authentication.getName();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username) // Gán username (email) vào "subject"
                .issuedAt(now)     // Thời điểm phát hành token
                .expiration(expiryDate) // Thời điểm hết hạn token
                .signWith(this.key)     // Ký token bằng secret key
                .compact();           // Build thành chuỗi token
    }

    /**
     * Trích xuất username (email) từ một token JWT.
     *
     * @param token Chuỗi JWT.
     * @return Username (email) lấy từ subject của token.
     * @throws io.jsonwebtoken.JwtException nếu token không hợp lệ hoặc không parse được.
     */
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(this.key) // Chỉ định key để xác thực chữ ký
                .build()
                .parseSignedClaims(token) // Parse và xác thực token
                .getPayload(); // Lấy phần payload (claims)

        return claims.getSubject(); // Lấy giá trị của subject (chính là email)
    }

    /**
     * Kiểm tra xem một token JWT có hợp lệ hay không (đúng chữ ký, chưa hết hạn, đúng định dạng).
     *
     * @param token Chuỗi JWT cần kiểm tra.
     * @return true nếu token hợp lệ, false nếu không.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(this.key) // Chỉ định key để xác thực
                    .build()
                    .parse(token); // Thử parse token (bao gồm cả xác thực)
            return true; // Nếu không có lỗi -> token hợp lệ
        } catch (SecurityException | MalformedJwtException ex) { // Gộp lỗi sai định dạng/chữ ký
            logger.error("Token JWT không hợp lệ: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Token JWT đã hết hạn: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Token JWT không được hỗ trợ: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            // Lỗi này thường xảy ra khi token string bị null hoặc rỗng
            logger.error("Chuỗi JWT không hợp lệ hoặc rỗng: {}", ex.getMessage());
        }
        return false; // Nếu có bất kỳ lỗi nào xảy ra -> token không hợp lệ
    }

     // generateToken(User user) 
     /*
     public String generateToken(com.example.orders.entity.User user) {
        // Cần đảm bảo package và class User entity là đúng
         Date now = new Date();
         Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

         return Jwts.builder()
                 .subject(user.getEmail()) // Giả sử User entity có getEmail()
                 .issuedAt(now)
                 .expiration(expiryDate)
                 .signWith(this.key)
                 .compact();
     }
     */
}
