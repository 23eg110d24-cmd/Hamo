package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;

public record MemberSelfUpdateRequest(@NotBlank String phone, @NotBlank String department) {
}
