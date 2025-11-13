package com.example.users.controller;

import com.example.users.dto.UserResponse;
import com.example.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User API", description = "Các API liên quan đến thông tin người dùng (yêu cầu xác thực)")
public class UserController {

    private final UserService userService;

    public UserController(@Lazy UserService userService) {
        this.userService = userService;
    }

    @Operation(
            summary = "Lấy thông tin người dùng hiện tại",
            description = "Trả về thông tin chi tiết của người dùng đã được xác thực (dựa trên JWT token).",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        UserResponse currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(currentUser);
    }
}