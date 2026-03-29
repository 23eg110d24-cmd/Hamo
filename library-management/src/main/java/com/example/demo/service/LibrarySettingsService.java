package com.example.demo.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.example.demo.dto.response.SystemSettingsResponse;

@Service
public class LibrarySettingsService {

    private static final long BORROW_PERIOD_DAYS = 7;
    private static final BigDecimal FINE_PER_WEEK = BigDecimal.valueOf(30);

    public long getBorrowPeriodDays() {
        return BORROW_PERIOD_DAYS;
    }

    public BigDecimal getFineAmountPerWeek() {
        return FINE_PER_WEEK;
    }

    public SystemSettingsResponse getSystemSettings() {
        return new SystemSettingsResponse(
                BORROW_PERIOD_DAYS,
                FINE_PER_WEEK,
                "SIMULATED",
                "FILE_BASED_H2",
                true,
                true);
    }
}
