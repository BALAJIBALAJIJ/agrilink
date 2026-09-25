package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.*;
import com.agrilink.model.enums.*;
import com.agrilink.service.AdminService;
import com.agrilink.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final PaymentService paymentService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats", adminService.getDashboardStats()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success("Users", adminService.searchUsers(search, pageRequest)));
        }

        UserRole userRole = role != null && !role.isBlank() ? UserRole.valueOf(role.toUpperCase()) : null;
        VerificationStatus verificationStatus = status != null && !status.isBlank() ?
                VerificationStatus.valueOf(status.toUpperCase()) : null;

        Page<User> users = adminService.getUsersByRoleAndStatus(userRole, verificationStatus, pageRequest);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<ApiResponse> approveUser(
            @AuthenticationPrincipal User admin,
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.getOrDefault("notes", "") : "";
        User user = adminService.approveUser(admin.getId(), id, notes);
        return ResponseEntity.ok(ApiResponse.success("User approved", user));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<ApiResponse> rejectUser(
            @AuthenticationPrincipal User admin,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        User user = adminService.rejectUser(admin.getId(), id, body.get("reason"));
        return ResponseEntity.ok(ApiResponse.success("User rejected", user));
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<ApiResponse> suspendUser(
            @AuthenticationPrincipal User admin,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        User user = adminService.suspendUser(admin.getId(), id, body.get("reason"));
        return ResponseEntity.ok(ApiResponse.success("User suspended", user));
    }

    @PutMapping("/users/{id}/request-changes")
    public ResponseEntity<ApiResponse> requestChanges(
            @AuthenticationPrincipal User admin,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        User user = adminService.requestChanges(admin.getId(), id, body.get("details"));
        return ResponseEntity.ok(ApiResponse.success("Changes requested", user));
    }

    @PutMapping("/payments/{id}/verify")
    public ResponseEntity<ApiResponse> verifyPayment(
            @AuthenticationPrincipal User admin,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        boolean approved = Boolean.parseBoolean(body.get("approved").toString());
        String notes = body.containsKey("notes") ? body.get("notes").toString() : "";
        Payment payment = paymentService.verifyPayment(id, admin.getId(), approved, notes);
        return ResponseEntity.ok(ApiResponse.success("Payment verification updated", payment));
    }

    @PostMapping("/dry-units")
    public ResponseEntity<ApiResponse> createDryUnit(
            @AuthenticationPrincipal User admin,
            @RequestBody DryUnit dryUnit) {
        DryUnit created = adminService.createDryUnit(admin.getId(), dryUnit);
        return ResponseEntity.ok(ApiResponse.success("Dry unit created", created));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<AuditLog> logs = adminService.getAuditLogs(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", logs));
    }
}
