package com.example.demo.dto.response;

import java.util.List;

public record ReadingInsightResponse(String readingPersona, String summary, List<String> focusAreas, String nextAction,
        String attentionNote, int completedBooks, int activeLoans, int waitlistCount) {
}
