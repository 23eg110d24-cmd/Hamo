package com.example.demo.dto.response;

import java.math.BigDecimal;

public record DashboardResponse(long totalBooks, long totalMembers, long totalUsers, long activeIssues, long overdueIssues,
        BigDecimal outstandingFines, BigDecimal finesCollected) {
}
