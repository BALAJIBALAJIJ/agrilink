package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.User;
import com.agrilink.service.CloudinaryService;
import com.agrilink.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<ApiResponse> createPayment(
            @AuthenticationPrincipal User user,
            @RequestParam String orderId,
            @RequestParam double amount,
            @RequestParam(defaultValue = "PRODUCT") String paymentType) {
        return ResponseEntity.ok(ApiResponse.success("Payment created",
                paymentService.createPayment(user.getId(), orderId, amount, paymentType)));
    }

    @PostMapping("/{id}/proof")
    public ResponseEntity<ApiResponse> uploadProof(
            @PathVariable String id,
            @RequestPart("proof") MultipartFile proof,
            @RequestParam(required = false) String paymentReference) {
        String proofUrl = cloudinaryService.uploadImage(proof, "payments");
        return ResponseEntity.ok(ApiResponse.success("Payment proof uploaded",
                paymentService.uploadPaymentProof(id, proofUrl, paymentReference)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getPayment(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved",
                paymentService.getPayment(id)));
    }

    @GetMapping("/my-payments")
    public ResponseEntity<ApiResponse> getMyPayments(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved",
                paymentService.getPaymentsByPayer(user.getId(), PageRequest.of(page, size))));
    }

    @GetMapping("/received")
    public ResponseEntity<ApiResponse> getReceivedPayments(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved",
                paymentService.getPaymentsByPayee(user.getId(), PageRequest.of(page, size))));
    }
}
