package com.example.demo.dto.request;

import com.example.demo.model.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        @NotNull UserRole role,
        String phone,
        String department) {
}
