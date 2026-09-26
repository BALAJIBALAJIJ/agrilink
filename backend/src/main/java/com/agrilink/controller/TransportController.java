package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.*;
import com.agrilink.model.enums.TransportStatus;
import com.agrilink.service.TransportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport")
@RequiredArgsConstructor
public class TransportController {

    private final TransportService transportService;

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse> createTransportRequest(@RequestBody Map<String, String> body) {
        TransportRequest request = transportService.createTransportRequest(body.get("orderId"));
        return ResponseEntity.ok(ApiResponse.success("Transport request created", request));
    }

    @PutMapping("/requests/{id}/accept")
    public ResponseEntity<ApiResponse> acceptRequest(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        TransportRequest request = transportService.acceptTransportRequest(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Transport request accepted", request));
    }

    @PutMapping("/requests/{id}/status")
    public ResponseEntity<ApiResponse> updateStatus(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        TransportStatus status = TransportStatus.valueOf(body.get("status"));
        transportService.updateTransportStatus(user.getId(), id, status);
        return ResponseEntity.ok(ApiResponse.success("Transport status updated"));
    }

    @PostMapping("/location")
    public ResponseEntity<ApiResponse> updateLocation(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        transportService.updateGpsLocation(
                user.getId(),
                (String) body.get("requestId"),
                ((Number) body.get("latitude")).doubleValue(),
                ((Number) body.get("longitude")).doubleValue(),
                body.containsKey("speed") ? ((Number) body.get("speed")).doubleValue() : 0,
                body.containsKey("heading") ? ((Number) body.get("heading")).doubleValue() : 0
        );
        return ResponseEntity.ok(ApiResponse.success("Location updated"));
    }

    @GetMapping("/{id}/location")
    public ResponseEntity<ApiResponse> getLatestLocation(@PathVariable String id) {
        GpsLocation location = transportService.getLatestLocation(id);
        return ResponseEntity.ok(ApiResponse.success("Location retrieved", location));
    }

    @GetMapping("/requests/available")
    public ResponseEntity<ApiResponse> getAvailableRequests() {
        List<TransportRequest> requests = transportService.getAvailableRequests();
        return ResponseEntity.ok(ApiResponse.success("Available requests", requests));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<ApiResponse> getRequest(@PathVariable String id) {
        TransportRequest request = transportService.getTransportRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Transport request retrieved", request));
    }

    @PostMapping("/duty/toggle")
    public ResponseEntity<ApiResponse> toggleDuty(@AuthenticationPrincipal User user) {
        transportService.toggleDuty(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Duty status toggled"));
    }

    @GetMapping("/duty/status")
    public ResponseEntity<ApiResponse> getDutyStatus(@AuthenticationPrincipal User user) {
        boolean dutyOn = transportService.isDutyOn(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Duty status", Map.of("dutyOn", dutyOn)));
    }

    @GetMapping("/active-delivery")
    public ResponseEntity<ApiResponse> getActiveDelivery(@AuthenticationPrincipal User user) {
        TransportRequest active = transportService.getActiveDelivery(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Active delivery", active));
    }

    @PostMapping("/requests/{id}/gps")
    public ResponseEntity<ApiResponse> updateGps(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        transportService.updateGpsLocation(
                user.getId(), id,
                ((Number) body.get("latitude")).doubleValue(),
                ((Number) body.get("longitude")).doubleValue(),
                body.containsKey("speed") ? ((Number) body.get("speed")).doubleValue() : 0,
                body.containsKey("heading") ? ((Number) body.get("heading")).doubleValue() : 0
        );
        return ResponseEntity.ok(ApiResponse.success("GPS updated"));
    }

    @PostMapping("/requests/{id}/confirm-cash")
    public ResponseEntity<ApiResponse> confirmCash(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        double cashAmount = ((Number) body.get("cashAmount")).doubleValue();
        transportService.confirmCashAndComplete(user.getId(), id, cashAmount);
        return ResponseEntity.ok(ApiResponse.success("Cash confirmed and delivery completed"));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse> getHistory(@AuthenticationPrincipal User user) {
        List<TransportRequest> history = transportService.getTransporterHistory(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Delivery history", history));
    }
}
