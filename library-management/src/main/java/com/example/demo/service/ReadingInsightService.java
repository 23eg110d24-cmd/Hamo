package com.example.demo.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.response.ReadingInsightResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.IssueRecord;
import com.example.demo.model.ReservationRecord;
import com.example.demo.model.ReservationStatus;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.MemberRepository;
import com.example.demo.repository.ReservationRepository;

@Service
public class ReadingInsightService {

    private final MemberRepository memberRepository;
    private final IssueRepository issueRepository;
    private final ReservationRepository reservationRepository;

    public ReadingInsightService(MemberRepository memberRepository, IssueRepository issueRepository,
            ReservationRepository reservationRepository) {
        this.memberRepository = memberRepository;
        this.issueRepository = issueRepository;
        this.reservationRepository = reservationRepository;
    }

    public ReadingInsightResponse buildInsights(Long memberId) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));

        List<IssueRecord> history = issueRepository.findByMemberId(memberId);
        List<ReservationRecord> reservations = reservationRepository.findByMemberIdOrderByCreatedAtDesc(memberId);

        long completedBooks = history.stream()
                .filter(issue -> issue.getReturnDate() != null)
                .count();
        long activeLoans = history.stream()
                .filter(issue -> issue.getReturnDate() == null)
                .count();
        long waitlistCount = reservations.stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.WAITLISTED)
                .count();
        long overdueCount = history.stream()
                .filter(issue -> !issue.isFinePaid() && issue.getFineAmount() != null && issue.getFineAmount().signum() > 0)
                .count();

        Map<String, Long> categoryCounts = history.stream()
                .collect(Collectors.groupingBy(issue -> normalize(issue.getBook().getCategory()), Collectors.counting()));
        Map<String, Long> authorCounts = history.stream()
                .collect(Collectors.groupingBy(issue -> normalize(issue.getBook().getAuthor()), Collectors.counting()));

        String topCategory = topKey(categoryCounts);
        String topAuthor = topKey(authorCounts);
        String readingPersona = resolveReadingPersona(categoryCounts, completedBooks, waitlistCount, overdueCount);
        String summary = buildSummary(readingPersona, completedBooks, activeLoans, topCategory, topAuthor, waitlistCount);
        List<String> focusAreas = buildFocusAreas(categoryCounts, authorCounts, waitlistCount, overdueCount);
        String nextAction = buildNextAction(completedBooks, waitlistCount, overdueCount, topCategory);
        String attentionNote = buildAttentionNote(activeLoans, overdueCount, reservations);

        return new ReadingInsightResponse(
                readingPersona,
                summary,
                focusAreas,
                nextAction,
                attentionNote,
                (int) completedBooks,
                (int) activeLoans,
                (int) waitlistCount);
    }

    private String resolveReadingPersona(Map<String, Long> categoryCounts, long completedBooks, long waitlistCount,
            long overdueCount) {
        if (completedBooks == 0 && waitlistCount == 0) {
            return "Curious Starter";
        }
        if (categoryCounts.size() >= 4) {
            return "Wide Explorer";
        }
        if (!categoryCounts.isEmpty()) {
            Map.Entry<String, Long> topCategory = categoryCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);
            if (topCategory != null && topCategory.getValue() >= Math.max(2, completedBooks / 2)) {
                return titleCase(topCategory.getKey()) + " Specialist";
            }
        }
        if (waitlistCount >= 2) {
            return "In-Demand Hunter";
        }
        if (overdueCount > 0) {
            return "Focused but Busy";
        }
        return "Steady Scholar";
    }

    private String buildSummary(String readingPersona, long completedBooks, long activeLoans, String topCategory,
            String topAuthor, long waitlistCount) {
        if (completedBooks == 0) {
            return "The reading profile is still warming up. One or two completed borrows will make the assistant much more precise.";
        }

        List<String> phrases = new ArrayList<>();
        phrases.add("This member reads like a " + readingPersona.toLowerCase(Locale.ROOT) + ".");
        if (!topCategory.isBlank()) {
            phrases.add("Their strongest pattern is " + titleCase(topCategory) + ".");
        }
        if (!topAuthor.isBlank()) {
            phrases.add("They also return to books by " + titleCase(topAuthor) + ".");
        }
        phrases.add("Completed " + completedBooks + " books so far with " + activeLoans + " currently in circulation.");
        if (waitlistCount > 0) {
            phrases.add("There are " + waitlistCount + " active waitlist choices shaping future demand.");
        }
        return String.join(" ", phrases);
    }

    private List<String> buildFocusAreas(Map<String, Long> categoryCounts, Map<String, Long> authorCounts,
            long waitlistCount, long overdueCount) {
        List<String> focusAreas = new ArrayList<>();

        categoryCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(2)
                .forEach(entry -> focusAreas.add(titleCase(entry.getKey()) + " interest"));

        authorCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(1)
                .forEach(entry -> focusAreas.add("Recurring author: " + titleCase(entry.getKey())));

        if (waitlistCount > 0) {
            focusAreas.add("High-demand reservation behavior");
        }
        if (overdueCount > 0) {
            focusAreas.add("Needs overdue follow-through");
        }

        return focusAreas.stream()
                .filter(value -> !value.isBlank())
                .distinct()
                .limit(4)
                .toList();
    }

    private String buildNextAction(long completedBooks, long waitlistCount, long overdueCount, String topCategory) {
        if (overdueCount > 0) {
            return "Clear overdue fines first so future borrowing stays smooth.";
        }
        if (waitlistCount > 0) {
            return "Keep watch on your reservations and jump on the next available copy quickly.";
        }
        if (completedBooks == 0) {
            return "Borrow a first title from the catalog to unlock richer AI suggestions.";
        }
        if (!topCategory.isBlank()) {
            return "Try another highly rated " + titleCase(topCategory) + " title while your momentum is strong.";
        }
        return "Explore a new recommendation to diversify the reading profile.";
    }

    private String buildAttentionNote(long activeLoans, long overdueCount, List<ReservationRecord> reservations) {
        if (overdueCount > 0) {
            return "Overdue activity is currently reducing the quality of future borrowing opportunities.";
        }
        if (activeLoans >= 3) {
            return "Reading engagement is high right now, with multiple active loans in progress.";
        }
        if (reservations.stream().anyMatch(reservation -> reservation.getStatus() == ReservationStatus.RESERVED)) {
            return "A reserved title is already waiting, so the next reading step can happen immediately.";
        }
        return "The account is in a healthy borrowing state with no urgent circulation blockers.";
    }

    private String topKey(Map<String, Long> counts) {
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("");
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private String titleCase(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String[] parts = value.split("\\s+");
        List<String> titled = new ArrayList<>(parts.length);
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            titled.add(part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1));
        }
        return String.join(" ", titled);
    }
}
