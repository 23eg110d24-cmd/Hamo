package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.PaymentRecord;
import com.example.demo.model.PaymentStatus;

public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {

    List<PaymentRecord> findByIssueRecordId(Long issueRecordId);

    List<PaymentRecord> findByStatus(PaymentStatus status);
}
