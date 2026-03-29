package com.example.demo.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BookRequest(
        @NotBlank String title,
        @NotBlank String author,
        @NotBlank String isbn,
        @NotBlank String category,
        String description,
        String language,
        @NotNull Integer publishedYear,
        @Min(1) int totalCopies,
        @DecimalMin("0.0") BigDecimal price,
        String tags,
        String coverUrl) {
}
