package com.example.products.service;

import com.example.products.dto.ReviewCreateRequest;
import com.example.products.dto.ReviewResponse;
import com.example.products.entity.Product;
import com.example.products.entity.Review;
import com.example.products.repository.ProductRepository;
import com.example.products.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public ReviewResponse createReview(String userId, ReviewCreateRequest req) {
        // 1. Kiểm tra sản phẩm tồn tại
        Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));

        // 2. Kiểm tra xem user đã đánh giá sản phẩm này trong đơn hàng này chưa
        if (reviewRepository.existsByUserIdAndProductIdAndOrderId(userId, req.productId(), req.orderId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi");
        }

        // 3. Tạo và lưu Review
        Review review = Review.builder()
                .userId(userId)
                .userName(req.userName() != null ? req.userName() : "Người dùng ẩn danh") // Fallback name
                .product(product)
                .orderId(req.orderId())
                .rating(req.rating())
                .comment(req.comment())
                .build();

        review = reviewRepository.save(review);

        // 4. Cập nhật thông tin thống kê cho Product (Average Rating & Review Count)
        updateProductRatingStats(product, req.rating());

        return mapToResponse(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsByProduct(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm");
        }
        return reviewRepository.findByProductId(productId, pageable)
                .map(this::mapToResponse);
    }

    // Logic tính toán lại điểm trung bình
    private void updateProductRatingStats(Product product, Integer newRating) {
        double currentTotalRating = product.getAverageRating() * product.getReviewCount();
        int newCount = product.getReviewCount() + 1;
        double newAverage = (currentTotalRating + newRating) / newCount;

        // Làm tròn 1 chữ số thập phân (4.56 -> 4.6)
        newAverage = Math.round(newAverage * 10.0) / 10.0;

        product.setReviewCount(newCount);
        product.setAverageRating(newAverage);
        
        productRepository.save(product);
    }

    private ReviewResponse mapToResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUserId(),
                review.getUserName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}