package com.example.orders.service;

import com.example.orders.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import org.springframework.util.StringUtils; 


// Implementation của UserServiceClient dùng WebClient.
@Component
@RequiredArgsConstructor
@Slf4j
public class UserServiceClientImpl implements UserServiceClient {

    private final WebClient webClient; // Inject WebClient đã cấu hình

    @Value("${app.client.users-service.url}") // Inject URL của User Service
    private String usersServiceUrl;

    @Override
    public UserDto getUserByEmail(String email, String bearerToken) {
        // Kiểm tra email hợp lệ
        if (!StringUtils.hasText(email)) {
            log.warn("Email không hợp lệ, không gọi User Service.");
            throw new BadCredentialsException("Email không hợp lệ.");
        }

        // Tạo URI 
        String uri = usersServiceUrl + "/api/users/by-email?email=" + email;
        log.debug("Gọi User Service URI: {}", uri);

        UserDto userDto = webClient.get()
                .uri(uri)
                .header("Authorization", bearerToken) // Gửi token
                .retrieve()
                // Xử lý lỗi HTTP 4xx
                .onStatus(HttpStatusCode::is4xxClientError, response -> {
                    log.error("Lỗi Client khi gọi User Service ({}) tại URI [{}]: {}",
                            response.statusCode(), uri, response.bodyToMono(String.class));
                    // Ném lỗi BadCredentialsException cho lỗi 4xx
                    return response.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new BadCredentialsException("Không tìm thấy người dùng hoặc request không hợp lệ: " + body)));
                })
                // Xử lý lỗi HTTP 5xx
                .onStatus(HttpStatusCode::is5xxServerError, response -> {
                    log.error("Lỗi Server khi gọi User Service ({}) tại URI [{}]: {}",
                            response.statusCode(), uri, response.bodyToMono(String.class));
                    return response.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new RuntimeException("Lỗi phía User Service: " + body)));
                })
                .bodyToMono(UserDto.class)
                .block(); 

        // Kiểm tra kết quả trả về
        if (userDto == null || userDto.id() == null) {
            log.error("Không nhận được ID người dùng hợp lệ từ User Service cho email: {}", email);
            throw new IllegalStateException("Không thể lấy được ID người dùng từ User Service.");
        }

        log.info("Lấy thành công thông tin userId: {} cho email: {}", userDto.id(), email);
        return userDto;
    }
}
