package com.example.demo.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MemberRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        @NotBlank String phone,
        @NotBlank String department,
        @NotBlank String membershipNumber,
        boolean active) {
}
