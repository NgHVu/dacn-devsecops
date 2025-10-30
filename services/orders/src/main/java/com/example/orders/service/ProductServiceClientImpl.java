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

/**
 * Implementation của ProductServiceClient, sử dụng WebClient để gọi API
 * đến Product Service.
 */
@Component 
@RequiredArgsConstructor
@Slf4j
public class ProductServiceClientImpl implements ProductServiceClient {

    private final WebClient webClient; // Inject WebClient đã cấu hình từ WebClientConfig

    @Value("${app.client.products-service.url}") // Inject URL của Product Service từ properties
    private String productsServiceUrl;

    @Override
    public List<ProductDto> getProductsByIds(Set<Long> productIds, String bearerToken) {
        // Nếu không có ID nào thì không cần gọi API
        if (productIds == null || productIds.isEmpty()) {
            log.warn("productIds rỗng hoặc null, không gọi Product Service.");
            return List.of(); // Trả về danh sách rỗng
        }

        // Tạo chuỗi param dạng "ids=1,2,3"
        String idsParam = productIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        // Tạo URI đầy đủ, ví dụ: http://products-app:8081/api/v1/products/by-ids?ids=1,2,3
        // Giả định Product Service dùng API versioning v1
        String uri = productsServiceUrl + "/api/products/by-ids?ids=" + idsParam;
        log.debug("Gọi Product Service URI: {}", uri); // Dùng debug level cho URI chi tiết

        List<ProductDto> productDtos = webClient.get()
                .uri(uri)
                .header("Authorization", bearerToken) // Gửi kèm token xác thực
                .retrieve()
                // Xử lý lỗi HTTP
                .onStatus(HttpStatusCode::is4xxClientError, response -> {
                    // Log chi tiết lỗi 4xx (vd: 404 Not Found)
                    log.error("Lỗi Client khi gọi Product Service ({}) tại URI [{}]: {}",
                            response.statusCode(), uri, response.bodyToMono(String.class)); // Log cả body lỗi nếu có
                    // Ném ra lỗi cụ thể để OrderService có thể bắt và xử lý
                    return response.bodyToMono(String.class)
                           .flatMap(body -> Mono.error(new IllegalArgumentException("Không tìm thấy sản phẩm hoặc request không hợp lệ: " + body)));
                })
                .onStatus(HttpStatusCode::is5xxServerError, response -> {
                    // Log chi tiết lỗi 5xx (vd: 500 Internal Server Error bên Product Service)
                    log.error("Lỗi Server khi gọi Product Service ({}) tại URI [{}]: {}",
                            response.statusCode(), uri, response.bodyToMono(String.class));
                    // Ném ra lỗi chung hơn
                     return response.bodyToMono(String.class)
                           .flatMap(body -> Mono.error(new RuntimeException("Lỗi phía Product Service: " + body)));
                })
                .bodyToFlux(ProductDto.class) // Mong đợi nhận về một danh sách ProductDto
                .collectList()
                // Tạm thời dùng block() để đợi kết quả.
                // Lưu ý: Trong môi trường Web MVC, việc này có thể chấp nhận được,
                // nhưng nếu cần hiệu năng cao hoặc chuyển sang Reactive, nên bỏ block().
                .block();

        // Kiểm tra xem số lượng sản phẩm trả về có đủ không
        if (productDtos == null || productDtos.size() != productIds.size()) {
            log.warn("Số lượng sản phẩm trả về từ Product Service ({}) không khớp yêu cầu ({}) cho các ID: {}",
                     productDtos != null ? productDtos.size() : 0, productIds.size(), productIds);
            // Tùy theo yêu cầu nghiệp vụ mà quyết định:
            // 1. Ném lỗi: Nếu bắt buộc phải có đủ thông tin mới cho tạo đơn hàng
            // throw new IllegalArgumentException("Không lấy được thông tin đầy đủ cho tất cả sản phẩm yêu cầu.");
            // 2. Chỉ cảnh báo và tiếp tục (có thể lọc ra những item hợp lệ trong OrderServiceImpl)
        }

        log.info("Lấy thành công thông tin {} sản phẩm từ Product Service.", productDtos != null ? productDtos.size() : 0);
        // Trả về danh sách rỗng nếu kết quả là null (phòng trường hợp hiếm gặp)
        return productDtos != null ? productDtos : List.of();
    }
}
