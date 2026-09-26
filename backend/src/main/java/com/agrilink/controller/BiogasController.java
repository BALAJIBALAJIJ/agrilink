package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.*;
import com.agrilink.service.BiogasService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/biogas")
@RequiredArgsConstructor
public class BiogasController {

    private final BiogasService biogasService;

    @GetMapping("/plants")
    public ResponseEntity<ApiResponse> getAllPlants() {
        return ResponseEntity.ok(ApiResponse.success("All biogas plants", biogasService.getAllPlants()));
    }

    @GetMapping("/nearest")
    public ResponseEntity<ApiResponse> findNearest(@RequestParam double lat, @RequestParam double lon) {
        return ResponseEntity.ok(ApiResponse.success("Nearest plant", biogasService.findNearestPlant(lat, lon)));
    }

    // ===== FARMER =====

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse> createRequest(
            @AuthenticationPrincipal User user,
            @RequestBody BiogasRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Request created",
                biogasService.createRequest(user.getId(), request)));
    }

    @GetMapping("/requests/farmer")
    public ResponseEntity<ApiResponse> getFarmerRequests(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Farmer requests",
                biogasService.getFarmerRequests(user.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @PutMapping("/requests/{id}/accept")
    public ResponseEntity<ApiResponse> farmerAccept(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Offer accepted",
                biogasService.farmerAcceptOffer(user.getId(), id)));
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<ApiResponse> farmerReject(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Offer rejected",
                biogasService.farmerRejectOffer(user.getId(), id)));
    }

    // ===== BIOGAS MANAGER =====

    @GetMapping("/manager/requests")
    public ResponseEntity<ApiResponse> getManagerRequests(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Manager requests",
                biogasService.getManagerRequests(user.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/manager/pending")
    public ResponseEntity<ApiResponse> getPending(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("Pending requests",
                biogasService.getPendingRequests(user.getId())));
    }

    @PutMapping("/manager/requests/{id}/offer")
    public ResponseEntity<ApiResponse> sendOffer(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success("Offer sent",
                biogasService.sendOffer(user.getId(), id,
                        ((Number) body.get("ratePerKg")).doubleValue(),
                        ((Number) body.get("totalAmount")).doubleValue(),
                        (String) body.get("suitability"))));
    }

    @PutMapping("/manager/requests/{id}/reject")
    public ResponseEntity<ApiResponse> rejectRequest(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Request rejected",
                biogasService.rejectRequest(user.getId(), id)));
    }

    @PutMapping("/manager/requests/{id}/payment")
    public ResponseEntity<ApiResponse> completePayment(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success("Payment completed",
                biogasService.completePayment(user.getId(), id,
                        ((Number) body.get("amount")).doubleValue())));
    }
}
