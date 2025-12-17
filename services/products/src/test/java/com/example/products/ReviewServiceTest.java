package com.example.products;

import com.example.products.dto.ReviewCreateRequest;
import com.example.products.dto.ReviewResponse;
import com.example.products.entity.Product;
import com.example.products.entity.Review;
import com.example.products.repository.ProductRepository;
import com.example.products.repository.ReviewRepository;
import com.example.products.service.ReviewService; // Import service từ package con
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private WebClient.Builder webClientBuilder;
    @Mock
    private WebClient webClient;
    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;

    @InjectMocks
    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        // Inject url property manually
        ReflectionTestUtils.setField(reviewService, "ordersServiceUrl", "http://orders-app");
    }

    private void mockWebClientSuccess(String status) {
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(URI.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.header(anyString(), anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        
        // Chỉ cần mock bodyToMono trả về Mono thật, phương thức timeout() sẽ tự động hoạt động trên Mono đó
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(status));
    }

    @Test
    @DisplayName("CreateReview: Success when order is DELIVERED")
    void createReview_Success() {
        // Given
        ReviewCreateRequest req = new ReviewCreateRequest(1L, 100L, 5, "Good", "UserA");
        Product product = Product.builder().id(1L).averageRating(0.0).reviewCount(0).build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId("user1", 1L, 100L)).thenReturn(false);
        
        // Mock WebClient call returning "DELIVERED"
        mockWebClientSuccess("DELIVERED");
        
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> {
            Review r = i.getArgument(0);
            r.setId(1L);
            return r;
        });

        // When
        ReviewResponse res = reviewService.createReview("user1", req);

        // Then
        assertThat(res).isNotNull();
        assertThat(res.rating()).isEqualTo(5);
        // Verify stats update: (0*0 + 5)/1 = 5.0
        assertThat(product.getAverageRating()).isEqualTo(5.0);
        assertThat(product.getReviewCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("CreateReview: Fail when order is NOT delivered")
    void createReview_Fail_OrderNotDelivered() {
        ReviewCreateRequest req = new ReviewCreateRequest(1L, 100L, 5, "Good", "UserA");
        Product product = new Product();
        product.setId(1L);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId("user1", 1L, 100L)).thenReturn(false);
        
        // Mock WebClient call returning "PENDING"
        mockWebClientSuccess("PENDING");

        assertThatThrownBy(() -> reviewService.createReview("user1", req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Đơn hàng chưa hoàn tất");
    }

    @Test
    @DisplayName("CreateReview: Fail if already reviewed")
    void createReview_Fail_Duplicate() {
        ReviewCreateRequest req = new ReviewCreateRequest(1L, 100L, 5, "Good", "UserA");
        when(productRepository.findById(1L)).thenReturn(Optional.of(new Product()));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId("user1", 1L, 100L)).thenReturn(true);

        assertThatThrownBy(() -> reviewService.createReview("user1", req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    @DisplayName("UpdateReview: Success and recalc stats")
    void updateReview_Success() {
        // Given: Product with avg 5.0 (1 review)
        Product product = Product.builder().id(1L).averageRating(5.0).reviewCount(1).build();
        Review existingReview = Review.builder().id(10L).userId("user1").rating(5).product(product).build();
        
        // Request update to 1 star
        ReviewCreateRequest req = new ReviewCreateRequest(1L, 100L, 1, "Bad", "UserA");

        when(reviewRepository.findById(10L)).thenReturn(Optional.of(existingReview));
        when(reviewRepository.save(any(Review.class))).thenReturn(existingReview);

        // When
        reviewService.updateReview(10L, "user1", req);

        // Then: New Avg = (5.0*1 - 5 + 1) / 1 = 1.0
        assertThat(product.getAverageRating()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("UpdateReview: Fail if not owner")
    void updateReview_Fail_Forbidden() {
        Review existingReview = Review.builder().id(10L).userId("user1").build();
        ReviewCreateRequest req = new ReviewCreateRequest(1L, 100L, 1, "Bad", "UserA");
        
        when(reviewRepository.findById(10L)).thenReturn(Optional.of(existingReview));

        assertThatThrownBy(() -> reviewService.updateReview(10L, "user2", req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    @DisplayName("DeleteReview: Success and recalc stats")
    void deleteReview_Success() {
        // Given: Product with avg 3.0 (2 reviews: 5 + 1)
        Product product = Product.builder().id(1L).averageRating(3.0).reviewCount(2).build();
        Review reviewToDelete = Review.builder().id(10L).userId("user1").rating(5).product(product).build();

        when(reviewRepository.findById(10L)).thenReturn(Optional.of(reviewToDelete));

        // When
        reviewService.deleteReview(10L, "user1", false);

        // Then: New Avg = (3.0*2 - 5) / (2-1) = 1.0
        assertThat(product.getReviewCount()).isEqualTo(1);
        assertThat(product.getAverageRating()).isEqualTo(1.0);
        verify(reviewRepository).delete(reviewToDelete);
    }

    @Test
    @DisplayName("GetReviews: Should return page")
    void getReviews_Success() {
        when(productRepository.existsById(1L)).thenReturn(true);
        when(reviewRepository.findByProductId(eq(1L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(new Review())));

        Page<ReviewResponse> res = reviewService.getReviewsByProduct(1L, Pageable.unpaged());
        assertThat(res).isNotEmpty();
    }
}