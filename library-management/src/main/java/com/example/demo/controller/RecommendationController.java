package com.example.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.response.BookRecommendationResponse;
import com.example.demo.service.RecommendationService;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/members/{memberId}")
    public List<BookRecommendationResponse> recommendForMember(@PathVariable Long memberId,
            @RequestParam(defaultValue = "5") int limit) {
        return recommendationService.recommendBooks(memberId, limit);
    }
}
