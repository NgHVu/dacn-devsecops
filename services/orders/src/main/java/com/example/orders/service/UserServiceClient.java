package com.example.orders.service;

import com.example.orders.dto.SendOrderEmailRequest;
import com.example.orders.dto.UserDto;
import org.springframework.security.authentication.BadCredentialsException;

public interface UserServiceClient {

    UserDto getCurrentUser(String bearerToken); 

    void sendOrderNotification(SendOrderEmailRequest request, String token);

}
