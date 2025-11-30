package com.example.products.repository;

import com.example.products.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // Lấy danh sách đánh giá của 1 sản phẩm (để hiển thị lên web)
    Page<Review> findByProductId(Long productId, Pageable pageable);

    // Kiểm tra xem User đã đánh giá sản phẩm trong đơn hàng này chưa
    // (Mỗi sản phẩm trong 1 đơn hàng chỉ được đánh giá 1 lần)
    boolean existsByUserIdAndProductIdAndOrderId(String userId, Long productId, Long orderId);
}