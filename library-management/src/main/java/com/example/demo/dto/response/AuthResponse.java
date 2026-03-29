package com.example.demo.dto.response;

import com.example.demo.model.UserRole;

public record AuthResponse(Long userId, String name, String email, UserRole role, String token, String refreshToken) {
}
