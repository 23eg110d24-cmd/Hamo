package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.IssueBookRequest;
import com.example.demo.model.IssueRecord;
import com.example.demo.service.IssueService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IssueRecord issueBook(@Valid @RequestBody IssueBookRequest request) {
        return issueService.issueBook(request);
    }

    @PutMapping("/{issueId}/return")
    public IssueRecord returnBook(@PathVariable Long issueId) {
        return issueService.returnBook(issueId);
    }

    @GetMapping
    public List<IssueRecord> getAllIssues() {
        return issueService.getAllIssues();
    }

    @GetMapping("/active")
    public List<IssueRecord> getActiveIssues() {
        return issueService.getActiveIssues();
    }

    @GetMapping("/overdue")
    public List<IssueRecord> getOverdueIssues() {
        return issueService.getOverdueIssues();
    }
}
