package com.example.products.dto;

import com.example.products.entity.Category;

public record CategoryDto(
    Long id,
    String name,
    String icon,
    String description,
    Long productCount 
) {
    public static CategoryDto fromEntity(Category category) {
        return new CategoryDto(
            category.getId(),
            category.getName(),
            category.getIcon(),
            category.getDescription(),
            0L 
        );
    }
}