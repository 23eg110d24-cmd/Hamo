package com.example.demo.dto.response;

import com.example.demo.model.UserRole;

public record CurrentUserResponse(Long userId, String name, String email, UserRole role) {
}
