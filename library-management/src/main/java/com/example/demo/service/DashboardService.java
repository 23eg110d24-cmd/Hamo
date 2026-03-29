package com.example.demo.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.example.demo.dto.response.DashboardResponse;
import com.example.demo.model.IssueStatus;
import com.example.demo.model.PaymentStatus;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.MemberRepository;
import com.example.demo.repository.PaymentRecordRepository;
import com.example.demo.repository.UserRepository;

@Service
public class DashboardService {

    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final PaymentRecordRepository paymentRecordRepository;

    public DashboardService(BookRepository bookRepository, MemberRepository memberRepository, UserRepository userRepository,
            IssueRepository issueRepository, PaymentRecordRepository paymentRecordRepository) {
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
        this.paymentRecordRepository = paymentRecordRepository;
    }

    public DashboardResponse getDashboard() {
        BigDecimal outstandingFines = issueRepository.findAll().stream()
                .filter(issue -> issue.getFineAmount() != null && !issue.isFinePaid())
                .map(issue -> issue.getFineAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal collectedFines = paymentRecordRepository.findByStatus(PaymentStatus.PAID).stream()
                .map(payment -> payment.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardResponse(
                bookRepository.count(),
                memberRepository.count(),
                userRepository.count(),
                issueRepository.findByStatus(IssueStatus.ISSUED).size(),
                issueRepository.findByStatus(IssueStatus.OVERDUE).size(),
                outstandingFines,
                collectedFines);
    }
}
