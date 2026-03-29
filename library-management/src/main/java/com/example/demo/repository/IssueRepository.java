package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.IssueRecord;
import com.example.demo.model.IssueStatus;

public interface IssueRepository extends JpaRepository<IssueRecord, Long> {

    List<IssueRecord> findByStatus(IssueStatus status);

    List<IssueRecord> findByMemberId(Long memberId);

    List<IssueRecord> findByDueDateBeforeAndStatus(LocalDate dueDate, IssueStatus status);

    boolean existsByMemberIdAndBookIdAndStatusIn(Long memberId, Long bookId, List<IssueStatus> statuses);
}
