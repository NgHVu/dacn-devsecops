package com.example.orders.service;

import com.example.orders.dto.ProductDto;
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
        if (productIds == null || productIds.isEmpty()) {
            log.warn("productIds rỗng hoặc null, không gọi Product Service.");
            return List.of();
        }

        String idsParam = productIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        String uri = productsServiceUrl + "/api/products/batch?ids=" + idsParam;
        
        log.debug("Gọi Product Service URI: {}", uri); 

        List<ProductDto> productDtos = webClient.get()
                .uri(uri)
                .header("Authorization", bearerToken) 
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response -> {
                    log.error("Lỗi Client khi gọi Product Service ({}) tại URI [{}]: {}",
                            response.statusCode(), uri, response.bodyToMono(String.class));
                    return response.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new IllegalArgumentException("Không tìm thấy sản phẩm hoặc request không hợp lệ: " + body)));
                })
                .onStatus(HttpStatusCode::is5xxServerError, response -> {
                    log.error("Lỗi Server khi gọi Product Service ({}) tại URI [{}]: {}",
                            response.statusCode(), uri, response.bodyToMono(String.class));
                    return response.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new RuntimeException("Lỗi phía Product Service: " + body)));
                })
                .bodyToFlux(ProductDto.class)
                .collectList()
                .block();

        if (productDtos == null || productDtos.size() != productIds.size()) {
            log.warn("Số lượng sản phẩm trả về từ Product Service ({}) không khớp yêu cầu ({}) cho các ID: {}",
                    productDtos != null ? productDtos.size() : 0, productIds.size(), productIds);
            throw new IllegalArgumentException("Không thể lấy thông tin đầy đủ cho tất cả sản phẩm yêu cầu.");
        }

        log.info("Lấy thành công thông tin {} sản phẩm từ Product Service.", productDtos.size());
        return productDtos;
    }
}