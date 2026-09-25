package com.agrilink.controller;

import com.agrilink.dto.request.*;
import com.agrilink.dto.response.ApiResponse;
import com.agrilink.dto.response.AuthResponse;
import com.agrilink.model.User;
import com.agrilink.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Admin login successful", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse> googleAuth(
            @RequestBody GoogleAuthRequest request,
            @RequestParam(required = false) String role) {
        AuthResponse response = authService.googleAuth(request, role);
        return ResponseEntity.ok(ApiResponse.success("Google authentication successful", response));
    }

    @PostMapping("/complete-profile")
    public ResponseEntity<ApiResponse> completeProfile(
            @AuthenticationPrincipal User user,
            @RequestBody ProfileCompleteRequest request) {
        AuthResponse response = authService.completeProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile completed", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("User retrieved", user));
    }
}
