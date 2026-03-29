package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.dto.request.MemberRequest;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Member;
import com.example.demo.repository.MemberRepository;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public Member createMember(MemberRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Member email already exists");
        }
        if (memberRepository.existsByMembershipNumber(request.membershipNumber())) {
            throw new BadRequestException("Membership number already exists");
        }

        Member member = new Member();
        apply(member, request);
        return memberRepository.save(member);
    }

    public List<Member> getMembers() {
        return memberRepository.findAll();
    }

    public Member getMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
    }

    public Member updateMember(Long memberId, MemberRequest request) {
        Member member = getMember(memberId);
        if (!member.getEmail().equals(request.email()) && memberRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Member email already exists");
        }
        if (!member.getMembershipNumber().equals(request.membershipNumber())
                && memberRepository.existsByMembershipNumber(request.membershipNumber())) {
            throw new BadRequestException("Membership number already exists");
        }
        apply(member, request);
        return memberRepository.save(member);
    }

    public void deleteMember(Long memberId) {
        memberRepository.delete(getMember(memberId));
    }

    public Member save(Member member) {
        return memberRepository.save(member);
    }

    private void apply(Member member, MemberRequest request) {
        member.setName(request.name());
        member.setEmail(request.email());
        member.setPhone(request.phone());
        member.setDepartment(request.department());
        member.setMembershipNumber(request.membershipNumber());
        member.setActive(request.active());
    }
}
