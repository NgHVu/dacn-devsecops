package com.example.users.controller;

import com.example.users.dto.ChangePasswordRequest;
import com.example.users.dto.UpdateProfileRequest;  
import com.example.users.dto.UserResponse;
import com.example.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType; 
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; 

@RestController
@RequestMapping("/api/users")
@Tag(name = "User API", description = "Các API liên quan đến thông tin người dùng và quản trị")
public class UserController {

    private final UserService userService;

    public UserController(@Lazy UserService userService) {
        this.userService = userService;
    }

    @Operation(
            summary = "Lấy thông tin người dùng hiện tại",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @Operation(summary = "Cập nhật thông tin cá nhân (Tên, SĐT, Địa chỉ)", security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(req));
    }

    @Operation(summary = "Đổi mật khẩu", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(req);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Upload ảnh đại diện", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadAvatar(file));
    }

    @Operation(summary = "[ADMIN] Lấy danh sách người dùng (có phân trang)", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('ADMIN')") 
    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @Parameter(hidden = true) @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @Operation(summary = "[ADMIN] Lấy chi tiết user theo ID", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @Operation(summary = "[ADMIN] Khóa/Mở khóa tài khoản user", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/lock")
    public ResponseEntity<Void> lockUser(
            @PathVariable Long id,
            @RequestParam boolean locked 
    ) {
        userService.lockUser(id, locked);
        return ResponseEntity.ok().build();
    }
}