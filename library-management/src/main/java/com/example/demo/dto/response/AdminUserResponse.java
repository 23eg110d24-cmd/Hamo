package com.example.demo.dto.response;

import java.time.LocalDateTime;

import com.example.demo.model.UserRole;

public record AdminUserResponse(Long id, String name, String email, UserRole role, boolean active,
        LocalDateTime createdAt) {
}
