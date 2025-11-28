package com.example.products.dto;

import com.example.products.entity.Category;

public record CategoryDto(
    Long id,
    String name,
    String description
) {
    public static CategoryDto fromEntity(Category category) {
        return new CategoryDto(
            category.getId(),
            category.getName(),
            category.getDescription()
        );
    }
}