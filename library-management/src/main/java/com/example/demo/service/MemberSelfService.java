package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.MemberSelfUpdateRequest;
import com.example.demo.dto.response.BookRecommendationResponse;
import com.example.demo.dto.response.CurrentUserResponse;
import com.example.demo.dto.response.ReadingInsightResponse;
import com.example.demo.model.IssueRecord;
import com.example.demo.model.Member;
import com.example.demo.model.PaymentRecord;
import com.example.demo.model.ReservationRecord;
import com.example.demo.model.User;

@Service
public class MemberSelfService {

    private final CurrentUserService currentUserService;
    private final MemberService memberService;
    private final IssueService issueService;
    private final PaymentService paymentService;
    private final RecommendationService recommendationService;
    private final ReservationService reservationService;
    private final ReadingInsightService readingInsightService;

    public MemberSelfService(CurrentUserService currentUserService, MemberService memberService, IssueService issueService,
            PaymentService paymentService, RecommendationService recommendationService,
            ReservationService reservationService, ReadingInsightService readingInsightService) {
        this.currentUserService = currentUserService;
        this.memberService = memberService;
        this.issueService = issueService;
        this.paymentService = paymentService;
        this.recommendationService = recommendationService;
        this.reservationService = reservationService;
        this.readingInsightService = readingInsightService;
    }

    public CurrentUserResponse getCurrentUser() {
        User user = currentUserService.getCurrentUser();
        return new CurrentUserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    public Member getMemberProfile() {
        return currentUserService.getCurrentMember();
    }

    public Member updateMemberProfile(MemberSelfUpdateRequest request) {
        Member member = currentUserService.getCurrentMember();
        member.setPhone(request.phone());
        member.setDepartment(request.department());
        return memberService.save(member);
    }

    public List<IssueRecord> getMyIssues() {
        Member member = currentUserService.getCurrentMember();
        return issueService.getIssuesForMember(member.getId());
    }

    public List<PaymentRecord> getMyPayments() {
        Member member = currentUserService.getCurrentMember();
        return paymentService.getPaymentsForMember(member.getId());
    }

    public List<BookRecommendationResponse> getMyRecommendations(int limit) {
        Member member = currentUserService.getCurrentMember();
        return recommendationService.recommendBooks(member.getId(), limit);
    }

    public ReadingInsightResponse getMyReadingInsights() {
        Member member = currentUserService.getCurrentMember();
        return readingInsightService.buildInsights(member.getId());
    }

    public List<ReservationRecord> getMyReservations() {
        return reservationService.getMyReservations();
    }

    public ReservationRecord createMyReservation(Long bookId) {
        return reservationService.createMyReservation(bookId);
    }

    public void cancelMyReservation(Long reservationId) {
        reservationService.cancelMyReservation(reservationId);
    }
}
