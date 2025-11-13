package com.example.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleUserInfo(
    String sub,
    String name,
    String email,
    @JsonProperty("email_verified")
    boolean emailVerified,
    String picture
) {
}