package com.example.orders.config;

import io.netty.channel.ChannelOption; 
import io.netty.handler.timeout.ReadTimeoutHandler; 
import io.netty.handler.timeout.WriteTimeoutHandler; 
import java.util.concurrent.TimeUnit; 
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType; 
import org.springframework.http.client.reactive.ReactorClientHttpConnector; 
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient; 

/**
 * Lớp cấu hình để tạo và quản lý một Bean {@link WebClient} duy nhất (singleton). 
 * WebClient này được cấu hình sẵn với timeouts và headers mặc định,
 * dùng để thực hiện các cuộc gọi HTTP bất đồng bộ đến các microservice khác.
 */
@Configuration
public class WebClientConfig {

    /**
     * Thời gian timeout (mili giây) cho các thao tác mạng (kết nối, đọc, ghi).
     * Được lấy từ application.properties, với giá trị mặc định là 5000ms (5 giây).
     */
    @Value("${app.client.timeout-ms:5000}")
    private int timeoutMs;

    /**
     * Tạo ra Bean WebClient được cấu hình sẵn.
     * @return Một instance của WebClient.
     */
    @Bean
    public WebClient webClient() {
        // 1. Cấu hình HttpClient của Reactor Netty với các timeouts
        HttpClient httpClient = HttpClient.create()
                // Timeout cho việc thiết lập kết nối ban đầu
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutMs)
                // Cấu hình timeouts cho việc đọc và ghi dữ liệu sau khi kết nối thành công
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(timeoutMs, TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(timeoutMs, TimeUnit.MILLISECONDS))
                );
       
        // 2. Xây dựng WebClient sử dụng HttpClient đã cấu hình
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                // Đặt các header mặc định sẽ được gửi cùng mọi request
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                // Không đặt baseUrl ở đây vì chúng ta cần gọi nhiều service khác nhau
                // .baseUrl("http://api-gateway:8080") // Ví dụ nếu dùng API Gateway
                .build();
    }
}
