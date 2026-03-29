package com.example.demo.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.ReservationRecord;
import com.example.demo.model.ReservationStatus;

public interface ReservationRepository extends JpaRepository<ReservationRecord, Long> {

    List<ReservationRecord> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    Optional<ReservationRecord> findFirstByBookIdAndStatusOrderByCreatedAtAsc(Long bookId, ReservationStatus status);

    Optional<ReservationRecord> findFirstByMemberIdAndBookIdAndStatusIn(Long memberId, Long bookId,
            Collection<ReservationStatus> statuses);
}
