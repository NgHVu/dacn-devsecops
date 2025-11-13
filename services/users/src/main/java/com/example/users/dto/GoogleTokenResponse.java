package com.example.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleTokenResponse(
    @JsonProperty("access_token")
    String accessToken
) {
}