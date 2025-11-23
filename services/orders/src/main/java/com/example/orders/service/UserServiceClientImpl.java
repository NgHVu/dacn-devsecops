package com.example.orders.service;

import com.example.orders.dto.SendOrderEmailRequest;
import com.example.orders.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserServiceClientImpl implements UserServiceClient {

    private final WebClient webClient;

    @Value("${app.client.users-service.url}")
    private String usersServiceUrl;

    @Override
    public UserDto getCurrentUser(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            log.warn("Token không hợp lệ hoặc thiếu.");
            throw new BadCredentialsException("Token không hợp lệ.");
        }

        String uri = usersServiceUrl + "/api/users/me";
        log.debug("Gọi User Service URI: {}", uri);

        UserDto userDto = webClient.get()
                .uri(uri)
                .header("Authorization", bearerToken) 
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response -> {
                    log.error("Lỗi Client khi gọi User Service ({}): Token không hợp lệ hoặc user không tồn tại.", response.statusCode());
                    return response.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new BadCredentialsException("Thông tin xác thực không hợp lệ: " + body)));
                })
                .onStatus(HttpStatusCode::is5xxServerError, response -> {
                    log.error("Lỗi Server khi gọi User Service ({}): {}", response.statusCode(), uri);
                    return response.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new RuntimeException("Lỗi phía User Service: " + body)));
                })
                .bodyToMono(UserDto.class)
                .block();

        if (userDto == null || userDto.id() == null) {
            log.error("Không nhận được ID người dùng hợp lệ từ User Service.");
            throw new IllegalStateException("Không thể lấy được ID người dùng từ User Service.");
        }

        log.info("Lấy thành công thông tin userId: {} từ token.", userDto.id());
        return userDto;
    }

    @Override
    public void sendOrderNotification(SendOrderEmailRequest request, String token) {
        String uri = usersServiceUrl + "/api/internal/email/send-order-notification";
        
        String bearerToken = (token != null && token.startsWith("Bearer ")) ? token : "Bearer " + token;

        log.info("Đang gửi tín hiệu email tới: {} cho Order #{}", uri, request.getOrderId());

        webClient.post()
                .uri(uri)
                .header("Authorization", bearerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .toBodilessEntity() 
                .subscribe(
                    response -> log.info("Đã gửi thành công tín hiệu email cho đơn hàng #{}", request.getOrderId()),
                    
                    error -> log.error("Gửi email thất bại: {}", error.getMessage())
                );
    }
}