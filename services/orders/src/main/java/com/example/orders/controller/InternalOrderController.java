package com.example.orders.controller;

import com.example.orders.entity.Order;
import com.example.orders.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/internal/orders")
@RequiredArgsConstructor
public class InternalOrderController {

    private final OrderRepository orderRepository;

    // API này chỉ dành cho các Service khác gọi (Inter-service communication)
    @GetMapping("/{id}/status")
    public ResponseEntity<String> getOrderStatus(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        
        // Trả về tên Enum (ví dụ: DELIVERED)
        return ResponseEntity.ok(order.getStatus().name());
    }
}