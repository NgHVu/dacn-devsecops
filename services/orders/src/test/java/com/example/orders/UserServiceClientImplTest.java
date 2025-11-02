package com.example.orders; 

import com.example.orders.dto.UserDto;
import com.example.orders.service.UserServiceClient;
import com.example.orders.service.UserServiceClientImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("UserServiceClientImpl Tests")
class UserServiceClientImplTest {

    private MockWebServer mockWebServer;
    private UserServiceClient userServiceClient;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("/").toString();
        

        objectMapper.registerModule(new JavaTimeModule());

        userServiceClient = new UserServiceClientImpl(WebClient.create(baseUrl));
        ReflectionTestUtils.setField(userServiceClient, "usersServiceUrl", baseUrl.substring(0, baseUrl.length() - 1)); // Bỏ dấu /
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    @DisplayName("getCurrentUser: Thành công khi service trả về 200 OK")
    void testGetCurrentUser_Success() throws Exception {
        UserDto mockUser = new UserDto(1L, "Test User", "test@example.com");
        String mockResponseBody = objectMapper.writeValueAsString(mockUser);

        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(mockResponseBody));

        UserDto result = userServiceClient.getCurrentUser("Bearer valid.token");

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.email()).isEqualTo("test@example.com");

        var recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("GET");
        assertThat(recordedRequest.getPath()).isEqualTo("/api/users/me"); 
        assertThat(recordedRequest.getHeader("Authorization")).isEqualTo("Bearer valid.token");
    }

    @Test
    @DisplayName("getCurrentUser: Ném lỗi BadCredentialsException khi service trả về 401")
    void testGetCurrentUser_401Unauthorized_ShouldThrowException() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(401)
                .setBody("Token không hợp lệ"));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> {
            userServiceClient.getCurrentUser("Bearer invalid.token");
        });

        assertThat(ex.getMessage()).contains("Thông tin xác thực không hợp lệ");
    }
}
