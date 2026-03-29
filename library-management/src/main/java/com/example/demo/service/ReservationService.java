package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Book;
import com.example.demo.model.IssueStatus;
import com.example.demo.model.Member;
import com.example.demo.model.ReservationRecord;
import com.example.demo.model.ReservationStatus;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.IssueRepository;
import com.example.demo.repository.ReservationRepository;

@Service
public class ReservationService {

    private static final Set<ReservationStatus> ACTIVE_STATUSES = Set.of(
            ReservationStatus.RESERVED,
            ReservationStatus.WAITLISTED);

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final IssueRepository issueRepository;
    private final CurrentUserService currentUserService;

    public ReservationService(ReservationRepository reservationRepository, BookRepository bookRepository,
            IssueRepository issueRepository, CurrentUserService currentUserService) {
        this.reservationRepository = reservationRepository;
        this.bookRepository = bookRepository;
        this.issueRepository = issueRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public ReservationRecord createMyReservation(Long bookId) {
        Member member = currentUserService.getCurrentMember();
        if (!member.isActive()) {
            throw new BadRequestException("Member is not active");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + bookId));

        Optional<ReservationRecord> existing = getActiveReservationForMemberAndBook(member.getId(), bookId);
        if (existing.isPresent()) {
            return existing.get();
        }

        if (issueRepository.existsByMemberIdAndBookIdAndStatusIn(member.getId(), bookId,
                List.of(IssueStatus.ISSUED, IssueStatus.OVERDUE))) {
            throw new BadRequestException("This book is already issued to the member");
        }

        ReservationRecord reservation = new ReservationRecord();
        reservation.setBook(book);
        reservation.setMember(member);
        if (book.getAvailableCopies() > 0) {
            reservation.setStatus(ReservationStatus.RESERVED);
            book.setAvailableCopies(book.getAvailableCopies() - 1);
            bookRepository.save(book);
        } else {
            reservation.setStatus(ReservationStatus.WAITLISTED);
        }

        return reservationRepository.save(reservation);
    }

    public List<ReservationRecord> getMyReservations() {
        Member member = currentUserService.getCurrentMember();
        return reservationRepository.findByMemberIdOrderByCreatedAtDesc(member.getId());
    }

    @Transactional
    public void cancelMyReservation(Long reservationId) {
        Member member = currentUserService.getCurrentMember();
        ReservationRecord reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (!reservation.getMember().getId().equals(member.getId())) {
            throw new BadRequestException("Reservation does not belong to the current member");
        }
        if (!ACTIVE_STATUSES.contains(reservation.getStatus())) {
            throw new BadRequestException("Only active reservations can be cancelled");
        }

        Book book = reservation.getBook();
        if (reservation.getStatus() == ReservationStatus.RESERVED) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservationRepository.save(reservation);
        promoteNextWaitlistedReservation(book);
    }

    public Optional<ReservationRecord> getActiveReservationForMemberAndBook(Long memberId, Long bookId) {
        return reservationRepository.findFirstByMemberIdAndBookIdAndStatusIn(memberId, bookId, ACTIVE_STATUSES);
    }

    @Transactional
    public void fulfillReservation(ReservationRecord reservation) {
        reservation.setStatus(ReservationStatus.FULFILLED);
        reservation.setFulfilledAt(LocalDateTime.now());
        reservationRepository.save(reservation);
    }

    @Transactional
    public void promoteNextWaitlistedReservation(Book book) {
        if (book.getAvailableCopies() <= 0) {
            return;
        }

        reservationRepository.findFirstByBookIdAndStatusOrderByCreatedAtAsc(book.getId(), ReservationStatus.WAITLISTED)
                .ifPresent(waitingReservation -> {
                    waitingReservation.setStatus(ReservationStatus.RESERVED);
                    book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
                    bookRepository.save(book);
                    reservationRepository.save(waitingReservation);
                });
    }
}
