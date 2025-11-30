package com.example.products.dto;

import java.time.OffsetDateTime;

public record ReviewResponse(
    Long id,
    String userId,
    String userName,
    Integer rating,
    String comment,
    OffsetDateTime createdAt
) {}