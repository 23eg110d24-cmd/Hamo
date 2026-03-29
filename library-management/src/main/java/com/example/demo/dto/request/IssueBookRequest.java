package com.example.demo.dto.request;

import jakarta.validation.constraints.NotNull;

public record IssueBookRequest(@NotNull Long bookId, @NotNull Long memberId, String notes) {
}
