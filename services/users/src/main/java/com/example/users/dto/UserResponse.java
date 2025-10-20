package com.example.users.dto;

import com.example.users.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO (Data Transfer Object) để trả về thông tin công khai của User.
 * Dùng để tránh làm lộ các thông tin nhạy cảm như mật khẩu.
 */
@Schema(description = "Payload chứa thông tin công khai của người dùng")
public record UserResponse(
    @Schema(description = "ID của người dùng", example = "1")
    Long id,

    @Schema(description = "Tên đầy đủ của người dùng", example = "Nguyễn Hoàng Vũ")
    String name,

    @Schema(description = "Địa chỉ email của người dùng", example = "nhoangvu2306@gmail.com")
    String email
) {
    /**
     * Factory method để dễ dàng tạo UserResponse từ một đối tượng User entity.
     * @param user Đối tượng User entity.
     * @return Một đối tượng UserResponse.
     */
    public static UserResponse fromEntity(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}
