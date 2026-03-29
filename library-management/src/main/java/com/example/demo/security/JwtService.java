package com.example.demo.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.example.demo.model.User;

@Service
public class JwtService {

    private final String secret;
    private final long expirationSeconds;

    public JwtService(@Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-seconds}") long expirationSeconds) {
        this.secret = secret;
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(User user) {
        long expiresAt = Instant.now().plusSeconds(expirationSeconds).getEpochSecond();
        String payload = user.getEmail() + "|" + user.getRole().name() + "|" + expiresAt;
        String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encodedPayload + "." + sign(encodedPayload);
    }

    public String extractUsername(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 2 || !MessageDigest.isEqual(sign(parts[0]).getBytes(StandardCharsets.UTF_8),
                parts[1].getBytes(StandardCharsets.UTF_8))) {
            return null;
        }
        String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        String[] fields = payload.split("\\|");
        if (fields.length != 3) {
            return null;
        }
        long expiresAt = Long.parseLong(fields[2]);
        if (Instant.now().getEpochSecond() > expiresAt) {
            return null;
        }
        return fields[0];
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username != null && username.equals(userDetails.getUsername());
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign token", exception);
        }
    }
}
