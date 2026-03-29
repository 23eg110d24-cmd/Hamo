package com.example.demo.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentOrderRequest(
        @NotNull Long issueId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String gateway,
        String callbackUrl) {
}
