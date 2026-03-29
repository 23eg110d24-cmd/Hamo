package com.example.demo.dto.response;

import java.math.BigDecimal;

public record SystemSettingsResponse(long borrowPeriodDays, BigDecimal fineAmountPerWeek, String paymentMode,
        String databaseMode, boolean reservationsEnabled, boolean aiRecommendationsEnabled) {
}
