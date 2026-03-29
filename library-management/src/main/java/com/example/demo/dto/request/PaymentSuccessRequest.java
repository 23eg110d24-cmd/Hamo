package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentSuccessRequest(
        @NotNull Long paymentRecordId,
        @NotBlank String gatewayOrderId,
        String gatewayPaymentId,
        String signature) {
}
