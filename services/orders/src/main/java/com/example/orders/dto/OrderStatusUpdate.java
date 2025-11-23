package com.example.orders.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusUpdate {
    @NotNull(message = "Trạng thái mới không được để trống")
    private String status; 
}