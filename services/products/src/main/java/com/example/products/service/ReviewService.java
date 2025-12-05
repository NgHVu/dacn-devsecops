package com.example.products.service;

import com.example.products.dto.ReviewCreateRequest;
import com.example.products.dto.ReviewResponse;
import com.example.products.entity.Product;
import com.example.products.entity.Review;
import com.example.products.repository.ProductRepository;
import com.example.products.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.services.orders.url:http://orders-app:8083}")
    private String ordersServiceUrl;

    public ReviewResponse createReview(String userId, ReviewCreateRequest req) {
        // 1. Validate Input
        if (req.rating() < 1 || req.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đánh giá phải từ 1 đến 5 sao");
        }

        // 2. Check Product
        Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));

        // 3. Verify Purchase Logic
        verifyPurchaseCondition(userId, req.productId(), req.orderId());

        // 4. Save Review
        Review review = Review.builder()
                .userId(userId)
                .userName(req.userName() != null ? req.userName() : "Khách hàng ẩn danh")
                .product(product)
                .orderId(req.orderId())
                .rating(req.rating())
                .comment(req.comment())
                .build();

        review = reviewRepository.save(review);

        // 5. Update Product Stats
        updateProductRatingStats(product, req.rating());

        return mapToResponse(review);
    }

    private void verifyPurchaseCondition(String userId, Long productId, Long orderId) {
        // Check duplicate local (đã review chưa)
        if (reviewRepository.existsByUserIdAndProductIdAndOrderId(userId, productId, orderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá sản phẩm cho đơn hàng này rồi.");
        }

        // Xây dựng URL an toàn
        URI uri = UriComponentsBuilder
                .fromHttpUrl(ordersServiceUrl)
                .path("/api/internal/orders/{id}/status")
                .buildAndExpand(orderId)
                .toUri();

        log.info("Verifying purchase at: {}", uri);

        try {
            String orderStatus = webClientBuilder.build()
                    .get()
                    .uri(uri)
                    .header("X-User-Id", userId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            log.info("Order ID {} status: {}", orderId, orderStatus);

            if (!"DELIVERED".equals(orderStatus) && !"COMPLETED".equals(orderStatus)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Đơn hàng chưa hoàn tất (Trạng thái: " + orderStatus + "). Vui lòng chờ giao hàng thành công.");
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify order status. URL: " + uri, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể xác thực trạng thái đơn hàng. Vui lòng thử lại sau.");
        }
    }

    private void updateProductRatingStats(Product product, Integer newRating) {
        long currentCount = product.getReviewCount();
        double currentAvg = product.getAverageRating();

        double newTotal = (currentAvg * currentCount) + newRating;
        long newCount = currentCount + 1;
        double newAvg = newTotal / newCount;

        // Làm tròn 1 chữ số thập phân
        newAvg = Math.round(newAvg * 10.0) / 10.0;

        product.setReviewCount((int) newCount);
        product.setAverageRating(newAvg);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsByProduct(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm");
        }
        return reviewRepository.findByProductId(productId, pageable)
                .map(this::mapToResponse);
    }

    private ReviewResponse mapToResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUserId(),
                review.getUserName(),
                review.getOrderId(), 
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt() 
        );
    }

    // --- LOGIC MỚI: UPDATE & DELETE ---

    public ReviewResponse updateReview(Long reviewId, String userId, ReviewCreateRequest req) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));

        // Check quyền: Chỉ chủ sở hữu mới được sửa
        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền sửa đánh giá này");
        }

        // Validate
        if (req.rating() < 1 || req.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đánh giá phải từ 1 đến 5 sao");
        }

        // Lưu giá trị cũ để tính lại rating trung bình
        int oldRating = review.getRating();

        // Update
        review.setRating(req.rating());
        review.setComment(req.comment());
        // Giả sử Entity Review có field updatedAt, nếu không có bạn có thể bỏ dòng này hoặc thêm vào Entity
        review.setUpdatedAt(OffsetDateTime.now());

        review = reviewRepository.save(review);

        // Recalculate Product Stats (Trừ cũ, cộng mới)
        recalculateProductRatingAfterUpdate(review.getProduct(), oldRating, req.rating());

        return mapToResponse(review);
    }

    public void deleteReview(Long reviewId, String userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));

        // Check quyền: Chủ sở hữu HOẶC Admin
        if (!isAdmin && !review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa đánh giá này");
        }

        Product product = review.getProduct();
        int ratingToRemove = review.getRating();

        reviewRepository.delete(review);

        // Recalculate Product Stats (Xóa rating này khỏi tổng)
        recalculateProductRatingAfterDelete(product, ratingToRemove);
    }

    // --- HELPER METHODS FOR RE-CALCULATION ---

    private void recalculateProductRatingAfterUpdate(Product product, int oldRating, int newRating) {
        long count = product.getReviewCount();
        if (count == 0) return; // Should not happen if data integrity is maintained

        double currentAvg = product.getAverageRating();
        double currentTotal = currentAvg * count;

        // Công thức: (Tổng cũ - điểm cũ + điểm mới) / số lượng cũ
        double newTotal = currentTotal - oldRating + newRating;
        double newAvg = newTotal / count;

        product.setAverageRating(Math.round(newAvg * 10.0) / 10.0);
        productRepository.save(product);
    }

    private void recalculateProductRatingAfterDelete(Product product, int ratingToRemove) {
        long count = product.getReviewCount();
        if (count <= 1) {
            // Nếu xóa review cuối cùng -> Reset về 0
            product.setReviewCount(0);
            product.setAverageRating(0.0);
        } else {
            double currentAvg = product.getAverageRating();
            double currentTotal = currentAvg * count;

            // Công thức: (Tổng cũ - điểm xóa) / (số lượng - 1)
            double newTotal = currentTotal - ratingToRemove;
            double newAvg = newTotal / (count - 1);

            product.setReviewCount((int) (count - 1));
            product.setAverageRating(Math.round(newAvg * 10.0) / 10.0);
        }
        productRepository.save(product);
    }
}