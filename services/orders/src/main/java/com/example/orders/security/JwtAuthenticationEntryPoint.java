package com.example.orders.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Component này xử lý các lỗi xác thực (AuthenticationException). 
 * Nó sẽ được kích hoạt khi một người dùng chưa xác thực (anonymous)
 * cố gắng truy cập vào một tài nguyên yêu cầu xác thực.
 * Nhiệm vụ của nó là trả về lỗi 401 Unauthorized (thay vì redirect về trang login).
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationEntryPoint.class);

    /**
     * Ghi đè phương thức commence để tùy chỉnh response lỗi.
     *
     * @param request       HttpServletRequest.
     * @param response      HttpServletResponse.
     * @param authException Lỗi AuthenticationException đã xảy ra.
     * @throws IOException
     * @throws ServletException
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        logger.error("Lỗi xác thực chưa được cấp phép (Unauthorized): {}", authException.getMessage());

        // Thiết lập response trả về là 401 Unauthorized
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // Mã lỗi 401

        // Tạo nội dung body JSON cho lỗi
        final Map<String, Object> body = new HashMap<>();
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        body.put("error", "Unauthorized");
        body.put("message", authException.getMessage()); // Thông điệp lỗi
        body.put("path", request.getServletPath()); // Đường dẫn API đã bị lỗi

        // Ghi body JSON vào response
        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
    }
}