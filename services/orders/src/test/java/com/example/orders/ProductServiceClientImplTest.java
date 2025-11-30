package com.example.orders;

import com.example.orders.dto.ProductDto;
import com.example.orders.service.ProductServiceClient;
import com.example.orders.service.ProductServiceClientImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("ProductServiceClientImpl Tests")
class ProductServiceClientImplTest {

    private MockWebServer mockWebServer;
    private ProductServiceClient productServiceClient;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("/").toString();

        WebClient webClient = WebClient.create(baseUrl);

        productServiceClient = new ProductServiceClientImpl(webClient);
        ReflectionTestUtils.setField(productServiceClient, "productsServiceUrl", baseUrl.substring(0, baseUrl.length() - 1)); // Bỏ dấu / ở cuối
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    @DisplayName("getProductsByIds: Thành công khi service trả về 200 OK")
    void testGetProductsByIds_Success() throws Exception {
        // [FIX] Cập nhật constructor ProductDto (thêm tham số image "img1.jpg")
        ProductDto mockProduct = new ProductDto(101L, "Sản phẩm 1", new BigDecimal("50.00"), "img1.jpg", 100);
        String mockResponseBody = objectMapper.writeValueAsString(List.of(mockProduct));
        
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(mockResponseBody));
        
        Set<Long> productIds = Set.of(101L);

        List<ProductDto> result = productServiceClient.getProductsByIds(productIds, "Bearer token");

        assertThat(result).isNotNull().hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Sản phẩm 1");
        // Kiểm tra thêm ảnh nếu cần
        assertThat(result.get(0).image()).isEqualTo("img1.jpg");

        var recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("GET");
        
        String expectedPath = "/api/products/batch?ids=" + productIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        assertThat(recordedRequest.getPath()).isEqualTo(expectedPath);
        
        assertThat(recordedRequest.getHeader("Authorization")).isEqualTo("Bearer token");
    }

    @Test
    @DisplayName("getProductsByIds: Ném lỗi IllegalArgumentException khi service trả về 404")
    void testGetProductsByIds_404NotFound_ShouldThrowException() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(404)
                .setBody("Không tìm thấy sản phẩm"));

        Set<Long> productIds = Set.of(101L);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            productServiceClient.getProductsByIds(productIds, "Bearer token");
        });

        assertThat(ex.getMessage()).contains("Không tìm thấy sản phẩm");
    }

    @Test
    @DisplayName("getProductsByIds: Ném lỗi RuntimeException khi service trả về 500")
    void testGetProductsByIds_500ServerError_ShouldThrowException() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(500)
                .setBody("Lỗi server nội bộ"));

        Set<Long> productIds = Set.of(101L);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            productServiceClient.getProductsByIds(productIds, "Bearer token");
        });

        assertThat(ex.getMessage()).contains("Lỗi phía Product Service");
    }
}