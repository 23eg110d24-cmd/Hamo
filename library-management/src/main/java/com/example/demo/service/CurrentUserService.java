package com.example.demo.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Member;
import com.example.demo.model.User;
import com.example.demo.repository.MemberRepository;
import com.example.demo.repository.UserRepository;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;
    private final MemberRepository memberRepository;

    public CurrentUserService(UserRepository userRepository, MemberRepository memberRepository) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public Member getCurrentMember() {
        User user = getCurrentUser();
        return memberRepository.findByEmailIgnoreCase(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No member profile linked to the current user"));
    }
}
