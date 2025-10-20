package com.example.users.controller;

import com.example.users.dto.UserResponse;
import com.example.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User API", description = "Các API liên quan đến thông tin người dùng (yêu cầu xác thực)")
public class UserController {

    private final UserService userService;

    @Operation(
            summary = "Lấy thông tin người dùng hiện tại",
            description = "Trả về thông tin chi tiết của người dùng đã được xác thực (dựa trên JWT token).",
            // Yêu cầu Swagger UI hiển thị nút "Authorize" để nhập token
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        UserResponse currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(currentUser);
    }
}
