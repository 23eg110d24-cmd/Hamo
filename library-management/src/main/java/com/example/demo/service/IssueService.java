package com.example.demo.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.request.IssueBookRequest;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Book;
import com.example.demo.model.IssueRecord;
import com.example.demo.model.IssueStatus;
import com.example.demo.model.Member;
import com.example.demo.model.ReservationRecord;
import com.example.demo.model.ReservationStatus;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.MemberRepository;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final ReservationService reservationService;
    private final LibrarySettingsService librarySettingsService;

    public IssueService(IssueRepository issueRepository, BookRepository bookRepository, MemberRepository memberRepository,
            ReservationService reservationService, LibrarySettingsService librarySettingsService) {
        this.issueRepository = issueRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.reservationService = reservationService;
        this.librarySettingsService = librarySettingsService;
    }

    @Transactional
    public IssueRecord issueBook(IssueBookRequest request) {
        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + request.bookId()));
        Member member = memberRepository.findById(request.memberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + request.memberId()));

        if (!member.isActive()) {
            throw new BadRequestException("Member is not active");
        }

        ReservationRecord activeReservation = reservationService
                .getActiveReservationForMemberAndBook(member.getId(), book.getId())
                .orElse(null);
        boolean hasReservedHold = activeReservation != null && activeReservation.getStatus() == ReservationStatus.RESERVED;

        if (book.getAvailableCopies() <= 0 && !hasReservedHold) {
            throw new BadRequestException("No available copies for this book");
        }

        IssueRecord record = new IssueRecord();
        record.setBook(book);
        record.setMember(member);
        record.setIssueDate(LocalDate.now());
        record.setDueDate(LocalDate.now().plusDays(librarySettingsService.getBorrowPeriodDays()));
        record.setStatus(IssueStatus.ISSUED);
        record.setFineAmount(BigDecimal.ZERO);
        record.setFinePaid(true);
        record.setNotes(request.notes());

        if (!hasReservedHold) {
            book.setAvailableCopies(book.getAvailableCopies() - 1);
        }
        bookRepository.save(book);
        IssueRecord savedRecord = issueRepository.save(record);
        if (activeReservation != null) {
            reservationService.fulfillReservation(activeReservation);
        }
        return savedRecord;
    }

    @Transactional
    public IssueRecord returnBook(Long issueId) {
        IssueRecord record = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue record not found: " + issueId));
        if (record.getStatus() == IssueStatus.RETURNED) {
            throw new BadRequestException("Book is already returned");
        }

        LocalDate today = LocalDate.now();
        record.setReturnDate(today);

        BigDecimal fine = calculateFine(record.getDueDate(), today);
        record.setFineAmount(fine);
        record.setFinePaid(fine.compareTo(BigDecimal.ZERO) == 0);
        record.setStatus(fine.compareTo(BigDecimal.ZERO) > 0 ? IssueStatus.OVERDUE : IssueStatus.RETURNED);

        Book book = record.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);
        IssueRecord savedRecord = issueRepository.save(record);
        reservationService.promoteNextWaitlistedReservation(book);
        return savedRecord;
    }

    public List<IssueRecord> getAllIssues() {
        updateOverdueStatuses();
        return issueRepository.findAll();
    }

    public List<IssueRecord> getActiveIssues() {
        updateOverdueStatuses();
        return issueRepository.findByStatus(IssueStatus.ISSUED);
    }

    public List<IssueRecord> getOverdueIssues() {
        updateOverdueStatuses();
        return issueRepository.findByStatus(IssueStatus.OVERDUE);
    }

    public List<IssueRecord> getIssuesForMember(Long memberId) {
        updateOverdueStatuses();
        return issueRepository.findByMemberId(memberId);
    }

    @Transactional
    public void updateOverdueStatuses() {
        List<IssueRecord> overdueRecords = issueRepository.findByDueDateBeforeAndStatus(LocalDate.now(), IssueStatus.ISSUED);
        for (IssueRecord record : overdueRecords) {
            record.setStatus(IssueStatus.OVERDUE);
            record.setFineAmount(calculateFine(record.getDueDate(), LocalDate.now()));
            record.setFinePaid(false);
        }
        issueRepository.saveAll(overdueRecords);
    }

    private BigDecimal calculateFine(LocalDate dueDate, LocalDate today) {
        long overdueDays = Math.max(0, ChronoUnit.DAYS.between(dueDate, today));
        if (overdueDays <= 0) {
            return BigDecimal.ZERO;
        }

        long overdueWeeks = (long) Math.ceil(overdueDays / 7.0);
        return librarySettingsService.getFineAmountPerWeek().multiply(BigDecimal.valueOf(overdueWeeks));
    }
}
