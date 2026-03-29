package com.example.demo.dto.response;

import java.math.BigDecimal;

public record PaymentOrderResponse(Long paymentRecordId, String gateway, String gatewayOrderId, BigDecimal amount,
        String currency, String checkoutKey, String redirectUrl, String status) {
}
