package com.example.demo.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.LogoutRequest;
import com.example.demo.dto.request.RefreshTokenRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.exception.BadRequestException;
import com.example.demo.model.Member;
import com.example.demo.model.RefreshToken;
import com.example.demo.model.User;
import com.example.demo.model.UserRole;
import com.example.demo.repository.MemberRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository, MemberRepository memberRepository, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email is already registered");
        }
        if (request.role() != UserRole.MEMBER) {
            throw new BadRequestException("Self registration is available only for MEMBER accounts");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        User savedUser = userRepository.save(user);
        createMemberProfile(savedUser, request);
        return buildResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = (User) authentication.getPrincipal();
        return buildResponse(user);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.validateToken(request.refreshToken());
        return buildResponse(refreshToken.getUser());
    }

    public void logout(LogoutRequest request) {
        refreshTokenService.revokeToken(request.refreshToken());
    }

    private AuthResponse buildResponse(User user) {
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
                jwtService.generateToken(user), refreshToken.getToken());
    }

    private void createMemberProfile(User user, RegisterRequest request) {
        Member member = new Member();
        member.setName(user.getName());
        member.setEmail(user.getEmail());
        member.setPhone(request.phone() == null || request.phone().isBlank() ? "Not Provided" : request.phone());
        member.setDepartment(
                request.department() == null || request.department().isBlank() ? "General" : request.department());
        member.setMembershipNumber("MEM-" + (1000 + user.getId()));
        member.setActive(true);
        memberRepository.save(member);
    }
}
