package com.example.orders.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO (Data Transfer Object) đại diện cho dữ liệu người dùng
 * mà orders-service nhận được khi gọi sang users-service 
 * Sử dụng record cho ngắn gọn. Trường cần thiết tối thiểu là id
 *
 * @param id    ID duy nhất của người dùng
 * @param name  Tên người dùng 
 * @param email Email người dùng
 */
@Schema(description = "Dữ liệu tóm tắt về người dùng nhận từ User Service")
public record UserDto(
        @Schema(description = "ID duy nhất của người dùng")
        Long id,

        @Schema(description = "Tên người dùng")
        String name, 

        @Schema(description = "Email người dùng")
        String email 
) {
}
