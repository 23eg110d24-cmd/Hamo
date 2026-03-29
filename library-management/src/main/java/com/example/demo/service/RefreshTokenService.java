package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exception.BadRequestException;
import com.example.demo.model.RefreshToken;
import com.example.demo.model.User;
import com.example.demo.repository.RefreshTokenRepository;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshExpiryDays;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.refresh-expiration-days}") long refreshExpiryDays) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshExpiryDays = refreshExpiryDays;
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        revokeActiveTokens(user.getId());
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString() + UUID.randomUUID());
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(refreshExpiryDays));
        refreshToken.setRevoked(false);
        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken validateToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Refresh token has expired or was revoked");
        }
        return refreshToken;
    }

    @Transactional
    public void revokeToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeActiveTokens(Long userId) {
        refreshTokenRepository.findByUserIdAndRevokedFalse(userId).forEach(token -> token.setRevoked(true));
    }
}
