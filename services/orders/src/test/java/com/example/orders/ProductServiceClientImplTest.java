package com.example.orders;

import com.example.orders.dto.ProductDto;
import com.example.orders.dto.ProductStockRequest;
import com.example.orders.service.ProductServiceClient;
import com.example.orders.service.ProductServiceClientImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("ProductServiceClientImpl Unit Tests - High Coverage")
class ProductServiceClientImplTest {

    private MockWebServer mockWebServer;
    private ProductServiceClient productServiceClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("/").toString();
        WebClient webClient = WebClient.builder().baseUrl(baseUrl).build();

        productServiceClient = new ProductServiceClientImpl(webClient);
        // Bỏ dấu / ở cuối baseUrl để khớp logic uri = productsServiceUrl + "/..."
        ReflectionTestUtils.setField(productServiceClient, "productsServiceUrl", baseUrl.substring(0, baseUrl.length() - 1));
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    // --- 1. TESTS FOR getProductsByIds ---

    @Test
    @DisplayName("getProductsByIds: Trả về list rỗng khi đầu vào null hoặc rỗng")
    void testGetProductsByIds_EmptyInput() {
        assertThat(productServiceClient.getProductsByIds(null, "token")).isEmpty();
        assertThat(productServiceClient.getProductsByIds(Collections.emptySet(), "token")).isEmpty();
    }

    @Test
    @DisplayName("getProductsByIds: Thành công khi service trả về 200 OK")
    void testGetProductsByIds_Success() throws Exception {
        ProductDto mockProduct = new ProductDto(101L, "Sản phẩm 1", new BigDecimal("50.00"), "img1.jpg", 100);
        String mockResponseBody = objectMapper.writeValueAsString(List.of(mockProduct));
        
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(mockResponseBody));
        
        Set<Long> productIds = Set.of(101L);
        List<ProductDto> result = productServiceClient.getProductsByIds(productIds, "Bearer token");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Sản phẩm 1");

        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("GET");
        assertThat(recordedRequest.getHeader("Authorization")).isEqualTo("Bearer token");
    }

    @Test
    @DisplayName("getProductsByIds: Ném IllegalArgumentException khi lỗi 4xx")
    void testGetProductsByIds_4xxError() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(400).setBody("Bad Request"));

        assertThrows(IllegalArgumentException.class, () -> 
            productServiceClient.getProductsByIds(Set.of(1L), "token"));
    }

    @Test
    @DisplayName("getProductsByIds: Ném RuntimeException khi lỗi 5xx")
    void testGetProductsByIds_5xxError() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(500).setBody("Internal Server Error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> 
            productServiceClient.getProductsByIds(Set.of(1L), "token"));
        
        assertThat(ex.getMessage()).contains("Lỗi Product Service");
    }

    // --- 2. TESTS FOR reduceStock ---

    @Test
    @DisplayName("reduceStock: Thành công")
    void testReduceStock_Success() throws Exception {
        mockWebServer.enqueue(new MockResponse().setResponseCode(200));

        List<ProductStockRequest> requests = List.of(new ProductStockRequest(1L, 5));
        assertDoesNotThrow(() -> productServiceClient.reduceStock(requests, "Bearer token"));

        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("POST");
        assertThat(recordedRequest.getPath()).isEqualTo("/api/products/internal/reduce-stock");
    }

    @Test
    @DisplayName("reduceStock: Ném IllegalStateException khi có lỗi")
    void testReduceStock_Error() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(400).setBody("Out of stock"));

        List<ProductStockRequest> requests = List.of(new ProductStockRequest(1L, 5));
        assertThrows(IllegalStateException.class, () -> 
            productServiceClient.reduceStock(requests, "token"));
    }

    // --- 3. TESTS FOR restoreStock ---

    @Test
    @DisplayName("restoreStock: Thành công")
    void testRestoreStock_Success() throws Exception {
        mockWebServer.enqueue(new MockResponse().setResponseCode(200));

        List<ProductStockRequest> requests = List.of(new ProductStockRequest(1L, 2));
        assertDoesNotThrow(() -> productServiceClient.restoreStock(requests, "token"));

        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("POST");
    }

    @Test
    @DisplayName("restoreStock: Ném RuntimeException khi có lỗi")
    void testRestoreStock_Error() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(500).setBody("DB Error"));

        List<ProductStockRequest> requests = List.of(new ProductStockRequest(1L, 2));
        assertThrows(RuntimeException.class, () -> 
            productServiceClient.restoreStock(requests, "token"));
    }

    // --- 4. TESTS FOR countActiveProducts ---

    @Test
    @DisplayName("countActiveProducts: Thành công")
    void testCountActiveProducts_Success() throws Exception {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("42"));

        long count = productServiceClient.countActiveProducts();

        assertThat(count).isEqualTo(42L);
        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getPath()).isEqualTo("/api/products/internal/count-active");
    }

    @Test
    @DisplayName("countActiveProducts: Trả về 0 khi có lỗi HTTP (onStatus)")
    void testCountActiveProducts_HttpError() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));

        long count = productServiceClient.countActiveProducts();
        
        assertThat(count).isZero();
    }

    @Test
    @DisplayName("countActiveProducts: Trả về 0 khi có ngoại lệ (Connection error)")
    void testCountActiveProducts_Exception() {
        // Enqueue một response bị lỗi header hoặc server ngắt kết nối
        mockWebServer.enqueue(new MockResponse().setSocketPolicy(okhttp3.mockwebserver.SocketPolicy.DISCONNECT_AT_START));

        long count = productServiceClient.countActiveProducts();

        assertThat(count).isZero();
    }
}