package com.example.products.controller;

import com.example.products.dto.ReviewCreateRequest;
import com.example.products.dto.ReviewResponse;
import com.example.products.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Review Controller", description = "Quản lý đánh giá sản phẩm")
@Slf4j
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "Tạo đánh giá mới", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewCreateRequest request,
            // Lấy User ID từ Security Context (JWT)
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = authentication.getName(); // Lấy userId từ "sub" trong JWT
        log.info("User {} đang tạo review cho sản phẩm {}", userId, request.productId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(userId, request));
    }

    @Operation(summary = "Lấy danh sách đánh giá theo sản phẩm")
    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<ReviewResponse>> getReviewsByProduct(
            @PathVariable Long productId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(reviewService.getReviewsByProduct(productId, pageable));
    }

    @Operation(summary = "Cập nhật đánh giá (Chỉ chủ sở hữu)", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewCreateRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(reviewService.updateReview(reviewId, authentication.getName(), request));
    }

    @Operation(summary = "Xóa đánh giá (Chủ sở hữu hoặc Admin)", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = authentication.getName();
        // Kiểm tra role admin từ Authentication authorities
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        reviewService.deleteReview(reviewId, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }
}