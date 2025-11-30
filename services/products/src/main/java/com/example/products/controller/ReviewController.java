package com.example.products.controller;

import com.example.products.dto.ReviewCreateRequest;
import com.example.products.dto.ReviewResponse;
import com.example.products.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "API quản lý đánh giá sản phẩm")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo đánh giá mới (Cần Token)")
    public ReviewResponse createReview(
            @RequestHeader("X-User-Id") String userId, // Lấy ID từ Gateway hoặc Token Filter
            @Valid @RequestBody ReviewCreateRequest request) {
        return reviewService.createReview(userId, request);
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Lấy danh sách đánh giá của sản phẩm")
    public Page<ReviewResponse> getProductReviews(
            @PathVariable Long productId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return reviewService.getReviewsByProduct(productId, pageable);
    }
}