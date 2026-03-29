package com.example.demo.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.example.demo.dto.response.BookRecommendationResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Book;
import com.example.demo.model.IssueRecord;
import com.example.demo.model.Member;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.MemberRepository;

@Service
public class RecommendationService {

    private static final Pattern OUTPUT_TEXT_PATTERN = Pattern.compile("\"text\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"");
    private static final Pattern REASON_PATTERN = Pattern.compile(
            "\"bookId\"\\s*:\\s*(\\d+)\\s*,\\s*\"reason\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"");

    private final MemberRepository memberRepository;
    private final IssueRepository issueRepository;
    private final BookRepository bookRepository;
    private final RestClient restClient;
    private final String openAiApiKey;
    private final String openAiModel;

    public RecommendationService(MemberRepository memberRepository, IssueRepository issueRepository,
            BookRepository bookRepository, RestClient.Builder restClientBuilder,
            @Value("${app.openai.api-key:}") String openAiApiKey,
            @Value("${app.openai.model:gpt-4.1-mini}") String openAiModel,
            @Value("${app.openai.base-url:https://api.openai.com/v1}") String openAiBaseUrl) {
        this.memberRepository = memberRepository;
        this.issueRepository = issueRepository;
        this.bookRepository = bookRepository;
        this.openAiApiKey = openAiApiKey;
        this.openAiModel = openAiModel;
        this.restClient = restClientBuilder
                .baseUrl(openAiBaseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public List<BookRecommendationResponse> recommendBooks(Long memberId, int limit) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        List<IssueRecord> history = issueRepository.findByMemberId(member.getId());
        List<BookRecommendationResponse> candidates = buildHeuristicRecommendations(history, limit);
        return enrichWithOpenAi(member, history, candidates);
    }

    private List<BookRecommendationResponse> buildHeuristicRecommendations(List<IssueRecord> history, int limit) {
        List<Book> allBooks = bookRepository.findAll();
        Set<Long> alreadyRead = history.stream()
                .map(issue -> issue.getBook().getId())
                .collect(Collectors.toSet());

        Map<String, Double> categoryScore = new HashMap<>();
        Map<String, Double> authorScore = new HashMap<>();

        for (IssueRecord issue : history) {
            Book book = issue.getBook();
            categoryScore.merge(normalize(book.getCategory()), 2.0, Double::sum);
            authorScore.merge(normalize(book.getAuthor()), 3.0, Double::sum);
        }

        return allBooks.stream()
                .filter(book -> !alreadyRead.contains(book.getId()))
                .map(book -> {
                    double score = 1.0;
                    score += categoryScore.getOrDefault(normalize(book.getCategory()), 0.0);
                    score += authorScore.getOrDefault(normalize(book.getAuthor()), 0.0);
                    score += Math.min(book.getAverageRating(), 5.0);
                    score += Math.max(0, book.getAvailableCopies()) * 0.1;
                    String reason = buildReason(book, categoryScore, authorScore, history.isEmpty());
                    return new BookRecommendationResponse(book.getId(), book.getTitle(), book.getAuthor(),
                            book.getCategory(), score, reason, book.getCoverUrl());
                })
                .sorted(Comparator.comparingDouble(BookRecommendationResponse::score).reversed())
                .limit(Math.max(1, limit))
                .toList();
    }

    private List<BookRecommendationResponse> enrichWithOpenAi(Member member, List<IssueRecord> history,
            List<BookRecommendationResponse> candidates) {
        if (openAiApiKey == null || openAiApiKey.isBlank() || candidates.isEmpty()) {
            return candidates;
        }
        try {
            String prompt = buildPrompt(member, history, candidates);
            String responseBody = restClient.post()
                    .uri("/responses")
                    .headers(headers -> headers.setBearerAuth(openAiApiKey))
                    .body(Map.of(
                            "model", openAiModel,
                            "input", prompt,
                            "text", Map.of(
                                    "format", Map.of("type", "json_object"))))
                    .retrieve()
                    .body(String.class);

            String responseText = extractText(responseBody);
            if (responseText == null || responseText.isBlank()) {
                return candidates;
            }

            Map<Long, String> aiReasons = extractReasons(responseText);
            List<BookRecommendationResponse> enhanced = new ArrayList<>();
            for (BookRecommendationResponse candidate : candidates) {
                String reason = aiReasons.getOrDefault(candidate.bookId(), candidate.reason());
                enhanced.add(new BookRecommendationResponse(candidate.bookId(), candidate.title(), candidate.author(),
                        candidate.category(), candidate.score(), reason, candidate.coverUrl()));
            }
            return enhanced;
        } catch (Exception exception) {
            return candidates;
        }
    }

    private Map<Long, String> extractReasons(String responseText) {
        Map<Long, String> reasons = new LinkedHashMap<>();
        Matcher matcher = REASON_PATTERN.matcher(responseText);
        while (matcher.find()) {
            reasons.put(Long.parseLong(matcher.group(1)), unescapeJson(matcher.group(2)));
        }
        return reasons;
    }

    private String extractText(String responseBody) {
        Matcher matcher = OUTPUT_TEXT_PATTERN.matcher(responseBody == null ? "" : responseBody);
        if (matcher.find()) {
            return unescapeJson(matcher.group(1));
        }
        return responseBody;
    }

    private String buildPrompt(Member member, List<IssueRecord> history, List<BookRecommendationResponse> candidates) {
        String historySummary = history.isEmpty()
                ? "No borrowing history yet."
                : history.stream()
                        .map(issue -> issue.getBook().getTitle() + " by " + issue.getBook().getAuthor() + " ("
                                + issue.getBook().getCategory() + ")")
                        .collect(Collectors.joining("; "));

        String candidateSummary = candidates.stream()
                .map(candidate -> "{\"bookId\": " + candidate.bookId() + ", \"title\": \"" + candidate.title()
                        + "\", \"author\": \"" + candidate.author() + "\", \"category\": \"" + candidate.category()
                        + "\"}")
                .collect(Collectors.joining(", "));

        return """
                Recommend books for this library member.
                Department: %s
                Borrowing history: %s
                Candidates: [%s]

                Return compact JSON in this shape only:
                {"recommendations":[{"bookId":1,"reason":"short personalized reason"}]}
                """.formatted(member.getDepartment(), historySummary, candidateSummary);
    }

    private String buildReason(Book book, Map<String, Double> categoryScore, Map<String, Double> authorScore,
            boolean coldStart) {
        if (coldStart) {
            return "Suggested from top-rated and available titles for new members";
        }
        if (authorScore.containsKey(normalize(book.getAuthor()))) {
            return "Recommended because the member already likes books from this author";
        }
        if (categoryScore.containsKey(normalize(book.getCategory()))) {
            return "Recommended from the member's frequently borrowed category";
        }
        return "Suggested from library popularity and availability signals";
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private String unescapeJson(String value) {
        return value.replace("\\\"", "\"").replace("\\n", " ").replace("\\\\", "\\");
    }
}
