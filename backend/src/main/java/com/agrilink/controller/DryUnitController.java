package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.*;
import com.agrilink.service.DryUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dry-unit")
@RequiredArgsConstructor
public class DryUnitController {

    private final DryUnitService dryUnitService;

    // ===== PUBLIC =====

    @GetMapping("/units")
    public ResponseEntity<ApiResponse> getAllUnits() {
        return ResponseEntity.ok(ApiResponse.success("All dry units", dryUnitService.getAllDryUnits()));
    }

    @GetMapping("/nearest")
    public ResponseEntity<ApiResponse> findNearest(@RequestParam double lat, @RequestParam double lon) {
        return ResponseEntity.ok(ApiResponse.success("Nearest dry unit", dryUnitService.findNearestDryUnit(lat, lon)));
    }

    // ===== FARMER =====

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse> createRequest(
            @AuthenticationPrincipal User user,
            @RequestBody DryUnitRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Request created",
                dryUnitService.createRequest(user.getId(), request)));
    }

    @GetMapping("/requests/farmer")
    public ResponseEntity<ApiResponse> getFarmerRequests(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Farmer requests",
                dryUnitService.getFarmerRequests(user.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @PutMapping("/requests/{id}/accept")
    public ResponseEntity<ApiResponse> farmerAccept(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Offer accepted",
                dryUnitService.farmerAcceptOffer(user.getId(), id)));
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<ApiResponse> farmerReject(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Offer rejected",
                dryUnitService.farmerRejectOffer(user.getId(), id)));
    }

    // ===== DRY UNIT MANAGER =====

    @GetMapping("/manager/requests")
    public ResponseEntity<ApiResponse> getManagerRequests(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Unit requests",
                dryUnitService.getUnitRequests(user.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/manager/pending")
    public ResponseEntity<ApiResponse> getPending(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("Pending requests",
                dryUnitService.getPendingRequests(user.getId())));
    }

    @PutMapping("/manager/requests/{id}/offer")
    public ResponseEntity<ApiResponse> sendOffer(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success("Offer sent",
                dryUnitService.sendOffer(user.getId(), id,
                        ((Number) body.get("ratePerKg")).doubleValue(),
                        ((Number) body.get("totalAmount")).doubleValue(),
                        (String) body.get("processingTime"))));
    }

    @PutMapping("/manager/requests/{id}/reject")
    public ResponseEntity<ApiResponse> rejectRequest(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Request rejected",
                dryUnitService.rejectRequest(user.getId(), id)));
    }

    @PutMapping("/manager/requests/{id}/payment")
    public ResponseEntity<ApiResponse> completePayment(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success("Payment completed",
                dryUnitService.completePayment(user.getId(), id,
                        ((Number) body.get("amount")).doubleValue())));
    }
}
