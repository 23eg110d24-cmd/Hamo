package com.example.demo.dto.response;

public record BookRecommendationResponse(Long bookId, String title, String author, String category, double score,
        String reason, String coverUrl) {
}
