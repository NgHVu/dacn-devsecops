package com.example.orders.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Lớp cấu hình chính cho Spring Security trong orders-service.
 * Kích hoạt bảo mật web, định nghĩa cách xử lý JWT và các quy tắc truy cập.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor 
public class SecurityConfig {

    // Inject các bean bảo mật cần thiết
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtAuthenticationEntryPoint unauthorizedHandler;

    /**
     * Tạo Bean cho bộ lọc JWT. Bean này sẽ được Spring quản lý.
     * @return một instance của JwtAuthenticationFilter.
     */
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        // Tạo filter bằng constructor
        return new JwtAuthenticationFilter(jwtTokenProvider);
    }

    /**
     * Tạo Bean PasswordEncoder (BCrypt).
     * Mặc dù orders-service không trực tiếp xử lý mật khẩu,
     * việc có bean này là cần thiết cho cấu hình Spring Security đầy đủ.
     * @return một instance PasswordEncoder.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Tạo Bean AuthenticationManager.
     * Được Spring Security sử dụng nội bộ.
     * @param authenticationConfiguration Cấu hình xác thực mặc định.
     * @return một instance AuthenticationManager.
     * @throws Exception
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Định nghĩa chuỗi bộ lọc bảo mật (Security Filter Chain).
     * Đây là nơi cấu hình các quy tắc truy cập, CORS, CSRF, session, và bộ lọc JWT.
     * @param http Đối tượng HttpSecurity để cấu hình.
     * @return SecurityFilterChain đã được cấu hình.
     * @throws Exception
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Vô hiệu hóa CSRF (Cross-Site Request Forgery) vì dùng JWT (stateless)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Cấu hình xử lý lỗi 401 Unauthorized (khi truy cập trái phép)
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))

                // 3. Cấu hình quản lý session: STATELESS (không dùng session phía server)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Định nghĩa các quy tắc ủy quyền (Authorization)
                .authorizeHttpRequests(authorize -> authorize
                        // Cho phép truy cập công khai các endpoint Swagger và Actuator
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        // Tất cả các request còn lại (bao gồm /api/v1/orders/**)
                        // đều yêu cầu phải được xác thực
                        .anyRequest().authenticated()
                )

                // 5. Thêm bộ lọc JWT vào trước bộ lọc UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        // 6. Build và trả về cấu hình chuỗi lọc
        return http.build();
    }
}