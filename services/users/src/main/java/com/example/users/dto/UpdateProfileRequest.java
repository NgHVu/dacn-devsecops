package com.example.users.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(min = 2, max = 50, message = "Tên phải từ 2 đến 50 ký tự")
    String name,

    @Pattern(regexp = "(^$|[0-9]{10})", message = "Số điện thoại không hợp lệ")
    String phoneNumber,

    String address
) {}