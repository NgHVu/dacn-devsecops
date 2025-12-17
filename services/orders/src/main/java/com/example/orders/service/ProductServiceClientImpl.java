package com.example.orders.service;

import com.example.orders.dto.ProductDto;
import com.example.orders.dto.ProductStockRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductServiceClientImpl implements ProductServiceClient {

    private final WebClient webClient;

    @Value("${app.client.products-service.url}")
    private String productsServiceUrl;

    @Override
    public List<ProductDto> getProductsByIds(Set<Long> productIds, String bearerToken) {
        if (productIds == null || productIds.isEmpty()) return List.of();

        String idsParam = productIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String uri = productsServiceUrl + "/api/products/batch?ids=" + idsParam;
        
        return webClient.get()
                .uri(uri)
                .header("Authorization", bearerToken) 
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response -> 
                    response.bodyToMono(String.class).flatMap(body -> Mono.error(new IllegalArgumentException("Lỗi Client: " + body)))
                )
                .onStatus(HttpStatusCode::is5xxServerError, response -> 
                    response.bodyToMono(String.class).flatMap(body -> Mono.error(new RuntimeException("Lỗi Product Service: " + body)))
                )
                .bodyToFlux(ProductDto.class)
                .collectList()
                .block();
    }

    @Override
    public void reduceStock(List<ProductStockRequest> requests, String bearerToken) {
        String uri = productsServiceUrl + "/api/products/internal/reduce-stock";
        log.info("Calling reduce stock: {}", uri);

        webClient.post()
                .uri(uri)
                .header("Authorization", bearerToken) 
                .bodyValue(requests)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> 
                    response.bodyToMono(String.class).flatMap(body -> Mono.error(new IllegalStateException(body)))
                )
                .toBodilessEntity()
                .block();
    }

    @Override
    public void restoreStock(List<ProductStockRequest> requests, String bearerToken) {
        String uri = productsServiceUrl + "/api/products/internal/restore-stock";
        log.info("Calling restore stock: {}", uri);

        webClient.post()
                .uri(uri)
                .header("Authorization", bearerToken) 
                .bodyValue(requests)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> 
                    response.bodyToMono(String.class).flatMap(body -> Mono.error(new RuntimeException("Lỗi hoàn kho: " + body)))
                )
                .toBodilessEntity()
                .block();
    }
    
    // [NEW] API để lấy số lượng sản phẩm đang active cho Dashboard
    @Override
    public long countActiveProducts() {
        String uri = productsServiceUrl + "/api/products/internal/count-active";
        
        try {
            return webClient.get()
                    .uri(uri)
                    // Internal API không cần token nếu được permitAll (dùng cho thống kê chung)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response -> {
                        log.error("Lỗi khi gọi countActiveProducts: {}", response.statusCode());
                        return Mono.error(new RuntimeException("Product Service lỗi khi đếm sản phẩm active."));
                    })
                    .bodyToMono(Long.class)
                    .block();
        } catch (Exception e) {
            log.error("Không thể kết nối đến Product Service để đếm sản phẩm: {}", e.getMessage());
            return 0;
        }
    }
}