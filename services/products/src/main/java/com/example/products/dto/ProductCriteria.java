package com.example.products.dto;

import java.math.BigDecimal;

public record ProductCriteria(
    String search,     
    Long categoryId,   
    BigDecimal minPrice,
    BigDecimal maxPrice,
    String sort         
) {}