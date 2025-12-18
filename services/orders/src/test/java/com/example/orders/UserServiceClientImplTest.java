package com.example.orders;

import com.example.orders.dto.SendOrderEmailRequest;
import com.example.orders.dto.UserDto;
import com.example.orders.service.UserServiceClientImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("UserServiceClientImpl Unit Tests")
class UserServiceClientImplTest {

    private MockWebServer mockWebServer;
    private UserServiceClientImpl userServiceClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("/").toString();
        WebClient webClient = WebClient.builder().baseUrl(baseUrl).build();

        userServiceClient = new UserServiceClientImpl(webClient);
        // Bỏ dấu / ở cuối baseUrl để khớp với logic nối chuỗi uri = usersServiceUrl + "/..."
        ReflectionTestUtils.setField(userServiceClient, "usersServiceUrl", baseUrl.substring(0, baseUrl.length() - 1));
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    // --- Tests for getCurrentUser ---

    @Test
    @DisplayName("getCurrentUser: Ném BadCredentialsException khi token null hoặc sai định dạng")
    void getCurrentUser_InvalidTokenFormat_ThrowsException() {
        assertThrows(BadCredentialsException.class, () -> userServiceClient.getCurrentUser(null));
        assertThrows(BadCredentialsException.class, () -> userServiceClient.getCurrentUser("InvalidToken"));
    }

    @Test
    @DisplayName("getCurrentUser: Thành công khi User Service trả về 200 OK")
    void getCurrentUser_Success() throws Exception {
        // FIX: Sử dụng Map thay vì constructor UserDto để tránh lỗi biên dịch khi record thay đổi cấu trúc
        Map<String, Object> mockUserMap = Map.of(
                "id", 1L,
                "name", "Test User",
                "email", "test@example.com",
                "role", "ROLE_USER"
        );

        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(objectMapper.writeValueAsString(mockUserMap)));

        UserDto result = userServiceClient.getCurrentUser("Bearer valid_token");

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.email()).isEqualTo("test@example.com");

        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getPath()).isEqualTo("/api/users/me");
        assertThat(recordedRequest.getHeader("Authorization")).isEqualTo("Bearer valid_token");
    }

    @Test
    @DisplayName("getCurrentUser: Ném BadCredentialsException khi nhận lỗi 4xx từ User Service")
    void getCurrentUser_4xxError_ThrowsBadCredentialsException() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(401)
                .setBody("Unauthorized"));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, 
                () -> userServiceClient.getCurrentUser("Bearer token"));
        
        assertThat(ex.getMessage()).contains("Thông tin xác thực không hợp lệ");
    }

    @Test
    @DisplayName("getCurrentUser: Ném RuntimeException khi nhận lỗi 5xx từ User Service")
    void getCurrentUser_5xxError_ThrowsRuntimeException() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(500)
                .setBody("Internal Server Error"));

        RuntimeException ex = assertThrows(RuntimeException.class, 
                () -> userServiceClient.getCurrentUser("Bearer token"));
        
        assertThat(ex.getMessage()).contains("Lỗi phía User Service");
    }

    @Test
    @DisplayName("getCurrentUser: Ném IllegalStateException khi phản hồi rỗng hoặc thiếu ID")
    void getCurrentUser_EmptyResponse_ThrowsException() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody("{}")); // Trả về object rỗng (id null)

        assertThrows(IllegalStateException.class, 
                () -> userServiceClient.getCurrentUser("Bearer token"));
    }

    // --- Tests for sendOrderNotification ---

    @Test
    @DisplayName("sendOrderNotification: Gửi request POST thành công tới User Service")
    void sendOrderNotification_Success() throws Exception {
        SendOrderEmailRequest emailRequest = new SendOrderEmailRequest(100L, 1L, "PENDING", new BigDecimal("1500.0"), new ArrayList<>());
        
        mockWebServer.enqueue(new MockResponse().setResponseCode(200));

        // Method này dùng subscribe() (async), nên ta không nhận giá trị trả về
        assertDoesNotThrow(() -> userServiceClient.sendOrderNotification(emailRequest, "token_without_prefix"));

        RecordedRequest recordedRequest = mockWebServer.takeRequest(5, TimeUnit.SECONDS);
        assertThat(recordedRequest).isNotNull();
        assertThat(recordedRequest.getMethod()).isEqualTo("POST");
        assertThat(recordedRequest.getPath()).isEqualTo("/api/internal/email/send-order-notification");
        
        // Kiểm tra logic tự động thêm prefix "Bearer "
        assertThat(recordedRequest.getHeader("Authorization")).isEqualTo("Bearer token_without_prefix");
        assertThat(recordedRequest.getHeader("Content-Type")).contains(MediaType.APPLICATION_JSON_VALUE);
    }

    @Test
    @DisplayName("sendOrderNotification: Vẫn chạy tiếp (chỉ log error) khi User Service trả về lỗi")
    void sendOrderNotification_ServerError_ShouldNotThrowException() throws Exception {
        SendOrderEmailRequest emailRequest = new SendOrderEmailRequest(100L, 1L, "PENDING", new BigDecimal("1500.0"), new ArrayList<>());
        
        // Giả lập lỗi server
        mockWebServer.enqueue(new MockResponse().setResponseCode(500).setBody("Server down"));

        // Vì sử dụng subscribe(..., error -> log.error), exception sẽ bị swallow và log lại, không ném ra ngoài
        assertDoesNotThrow(() -> userServiceClient.sendOrderNotification(emailRequest, "Bearer token"));
        
        RecordedRequest recordedRequest = mockWebServer.takeRequest(5, TimeUnit.SECONDS);
        assertThat(recordedRequest).isNotNull();
    }
}