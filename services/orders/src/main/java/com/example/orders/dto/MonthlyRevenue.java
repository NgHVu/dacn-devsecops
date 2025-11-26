package com.example.orders.dto;

import java.math.BigDecimal;

public record MonthlyRevenue(
    int year,
    int month,
    BigDecimal total
) {}