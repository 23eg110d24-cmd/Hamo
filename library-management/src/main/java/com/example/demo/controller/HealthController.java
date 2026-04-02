package com.example.demo.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.config.DataSeedStatus;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSeedStatus dataSeedStatus;

    public HealthController(DataSeedStatus dataSeedStatus) {
        this.dataSeedStatus = dataSeedStatus;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        if (!dataSeedStatus.isComplete()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("status", "STARTING", "service", "hamo-api"));
        }
        return ResponseEntity.ok(Map.of("status", "UP", "service", "hamo-api"));
    }
}
