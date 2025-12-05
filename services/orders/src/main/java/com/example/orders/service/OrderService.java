package com.example.orders.service;

import com.example.orders.dto.DashboardStats; // <-- Import mới
import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderResponse;
import com.example.orders.dto.OrderStatusUpdate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    OrderResponse createOrder(OrderCreateRequest orderRequest, String bearerToken);

    Page<OrderResponse> getOrders(String userEmail, String bearerToken, Pageable pageable);

    OrderResponse getOrderById(Long orderId, String userEmail, String bearerToken);

    Page<OrderResponse> getAllOrders(Pageable pageable);

    OrderResponse updateOrderStatus(Long orderId, OrderStatusUpdate statusUpdate);
    
    DashboardStats getDashboardStats();
}