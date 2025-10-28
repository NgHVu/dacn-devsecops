package com.example.orders.security; 

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor; 
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filter chạy một lần cho mỗi request, kiểm tra JWT trong header Authorization. 
 * Nếu token hợp lệ, filter sẽ trích xuất thông tin (email) và thiết lập
 * Authentication trong SecurityContext, đánh dấu request đã được xác thực.
 * Service này tin tưởng token được cấp bởi User Service và không cần load lại UserDetails.
 */
@RequiredArgsConstructor 
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) 
            throws ServletException, IOException {
        try {
            // 1. Lấy JWT từ request header
            String jwt = getJwtFromRequest(request);

            // 2. Kiểm tra token có tồn tại và hợp lệ không
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                // 3. Lấy username (email) từ token
                String username = jwtTokenProvider.getUsernameFromToken(jwt);

                // 4. Tạo đối tượng Authentication
                // Principal là username (email), credentials là null, authorities rỗng
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        Collections.emptyList() 
                );

                // 5. Đặt chi tiết request (IP, session ID nếu có...)
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 6. Lưu Authentication vào SecurityContext -> Spring biết user đã đăng nhập
                SecurityContextHolder.getContext().setAuthentication(authentication);

                logger.debug("Đã thiết lập Security Context cho user: {}", username);
            }
        } catch (Exception ex) {
            // Log lỗi nếu có vấn đề trong quá trình xử lý token
            logger.error("Không thể thiết lập xác thực người dùng trong security context: {}", ex.getMessage());
            // request sẽ đi tiếp và nếu cần xác thực mà chưa có,
            // JwtAuthenticationEntryPoint sẽ được kích hoạt sau đó.
        }

        // 7. Quan trọng: Cho request đi tiếp trong chuỗi filter
        filterChain.doFilter(request, response);
    }

    /**
     * Helper method: Lấy chuỗi JWT từ header "Authorization".
     *
     * @param request HttpServletRequest đến.
     * @return Chuỗi JWT (đã bỏ "Bearer ") hoặc null nếu không có header hợp lệ.
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization"); // Lấy header
        // Kiểm tra header có text và bắt đầu bằng "Bearer "
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Trả về phần token
        }
        return null; // Không tìm thấy token hợp lệ
    }
}
