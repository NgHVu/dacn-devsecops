package com.example.products.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ProductStockRequest(
        @NotNull Long productId,
        @Min(1) Integer quantity
) {}