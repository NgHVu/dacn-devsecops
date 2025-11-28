package com.example.users.dto;

import com.example.users.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Payload chứa thông tin công khai của người dùng")
public record UserResponse(
    @Schema(description = "ID của người dùng", example = "1")
    Long id,

    @Schema(description = "Tên đầy đủ của người dùng", example = "Nguyễn Hoàng Vũ")
    String name,

    @Schema(description = "Địa chỉ email của người dùng", example = "nhoangvu2306@gmail.com")
    String email,

    @Schema(description = "Vai trò của người dùng (ví dụ: ROLE_USER, ROLE_ADMIN)", example = "ROLE_USER")
    String role,

    @Schema(description = "Số điện thoại", example = "0909123456")
    String phoneNumber,

    @Schema(description = "Địa chỉ giao hàng", example = "123 Đường A, Quận B")
    String address,

    @Schema(description = "URL ảnh đại diện", example = "/uploads/avatars/user1.jpg")
    String avatar,

    @Schema(description = "Trạng thái hoạt động (true = không bị khóa)", example = "true")
    boolean accountNonLocked
) {

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(), 
            user.getName(), 
            user.getEmail(),
            user.getRole().name(),
            user.getPhoneNumber(),
            user.getAddress(),
            user.getAvatar(),
            user.isAccountNonLocked()
        );
    }
}