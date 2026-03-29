package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.MemberRequest;
import com.example.demo.model.Member;
import com.example.demo.service.MemberService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Member createMember(@Valid @RequestBody MemberRequest request) {
        return memberService.createMember(request);
    }

    @GetMapping
    public List<Member> getMembers() {
        return memberService.getMembers();
    }

    @GetMapping("/{memberId}")
    public Member getMember(@PathVariable Long memberId) {
        return memberService.getMember(memberId);
    }

    @PutMapping("/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public Member updateMember(@PathVariable Long memberId, @Valid @RequestBody MemberRequest request) {
        return memberService.updateMember(memberId, request);
    }

    @DeleteMapping("/{memberId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMember(@PathVariable Long memberId) {
        memberService.deleteMember(memberId);
    }
}
