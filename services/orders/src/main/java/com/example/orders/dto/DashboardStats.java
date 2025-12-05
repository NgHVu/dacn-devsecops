package com.example.orders.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardStats(
    BigDecimal totalRevenue,    
    double revenueGrowth,       
    long totalOrders,           
    long newCustomers,          
    List<MonthlyStats> monthlyRevenue, 
    List<OrderResponse> recentSales   
) {
    public record MonthlyStats(String name, BigDecimal total) {}
}