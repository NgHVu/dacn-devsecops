package com.example.users.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Authorization code không được để trống")
        String code
) {
}