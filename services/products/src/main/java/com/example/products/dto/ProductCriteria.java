package com.example.products.dto;

import java.math.BigDecimal;

public record ProductCriteria(
    String search,      // Tìm kiếm theo tên
    Long categoryId,    // Lọc theo danh mục
    BigDecimal minPrice,// Giá thấp nhất
    BigDecimal maxPrice,// Giá cao nhất
    String sort         // Sắp xếp: "price_asc", "price_desc", "newest"
) {}