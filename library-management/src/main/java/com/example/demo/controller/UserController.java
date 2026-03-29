package com.example.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.request.UserStatusRequest;
import com.example.demo.dto.response.AdminUserResponse;
import com.example.demo.service.UserAdminService;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserAdminService userAdminService;

    public UserController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping
    public List<AdminUserResponse> getUsers() {
        return userAdminService.getUsers();
    }

    @PutMapping("/{userId}/status")
    public AdminUserResponse updateStatus(@PathVariable Long userId, @RequestBody UserStatusRequest request) {
        return userAdminService.updateStatus(userId, request);
    }
}
