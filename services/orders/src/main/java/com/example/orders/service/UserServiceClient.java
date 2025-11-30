package com.example.orders.service;

import com.example.orders.dto.SendOrderEmailRequest;
import com.example.orders.dto.UserDto;

public interface UserServiceClient {
    UserDto getCurrentUser(String bearerToken);
    void sendOrderNotification(SendOrderEmailRequest request, String token);
}