package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.response.SystemSettingsResponse;
import com.example.demo.service.LibrarySettingsService;

@RestController
@RequestMapping("/api/settings")
@PreAuthorize("hasRole('ADMIN')")
public class SettingsController {

    private final LibrarySettingsService librarySettingsService;

    public SettingsController(LibrarySettingsService librarySettingsService) {
        this.librarySettingsService = librarySettingsService;
    }

    @GetMapping
    public SystemSettingsResponse getSettings() {
        return librarySettingsService.getSystemSettings();
    }
}
