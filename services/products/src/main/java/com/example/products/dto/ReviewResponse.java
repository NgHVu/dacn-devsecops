package com.example.products.dto;

import java.time.OffsetDateTime;

public record ReviewResponse(
    Long id,
    String userId,
    String userName,
    Long orderId, // [NEW] Thêm trường này để Frontend dùng khi Update review
    Integer rating,
    String comment,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt // [NEW] Thêm trường này

) {}