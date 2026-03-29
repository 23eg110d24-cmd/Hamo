package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.MemberSelfUpdateRequest;
import com.example.demo.dto.request.ReservationRequest;
import com.example.demo.dto.response.BookRecommendationResponse;
import com.example.demo.dto.response.CurrentUserResponse;
import com.example.demo.dto.response.ReadingInsightResponse;
import com.example.demo.model.IssueRecord;
import com.example.demo.model.Member;
import com.example.demo.model.PaymentRecord;
import com.example.demo.model.ReservationRecord;
import com.example.demo.service.MemberSelfService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final MemberSelfService memberSelfService;

    public MeController(MemberSelfService memberSelfService) {
        this.memberSelfService = memberSelfService;
    }

    @GetMapping
    public CurrentUserResponse getCurrentUser() {
        return memberSelfService.getCurrentUser();
    }

    @GetMapping("/member-profile")
    public Member getMemberProfile() {
        return memberSelfService.getMemberProfile();
    }

    @PutMapping("/member-profile")
    public Member updateMemberProfile(@Valid @RequestBody MemberSelfUpdateRequest request) {
        return memberSelfService.updateMemberProfile(request);
    }

    @GetMapping("/issues")
    public List<IssueRecord> getMyIssues() {
        return memberSelfService.getMyIssues();
    }

    @GetMapping("/payments")
    public List<PaymentRecord> getMyPayments() {
        return memberSelfService.getMyPayments();
    }

    @GetMapping("/recommendations")
    public List<BookRecommendationResponse> getMyRecommendations(@RequestParam(defaultValue = "5") int limit) {
        return memberSelfService.getMyRecommendations(limit);
    }

    @GetMapping("/reading-insights")
    public ReadingInsightResponse getMyReadingInsights() {
        return memberSelfService.getMyReadingInsights();
    }

    @GetMapping("/reservations")
    public List<ReservationRecord> getMyReservations() {
        return memberSelfService.getMyReservations();
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationRecord createMyReservation(@Valid @RequestBody ReservationRequest request) {
        return memberSelfService.createMyReservation(request.bookId());
    }

    @DeleteMapping("/reservations/{reservationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelMyReservation(@PathVariable Long reservationId) {
        memberSelfService.cancelMyReservation(reservationId);
    }
}
