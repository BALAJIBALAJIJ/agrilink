package com.agrilink.service;

import com.agrilink.exception.*;
import com.agrilink.model.*;
import com.agrilink.model.enums.*;
import com.agrilink.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public Payment createPayment(String payerId, String orderId, double amount, String paymentType) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Payment payment = Payment.builder()
                .orderId(orderId)
                .payerId(payerId)
                .payeeId(order.getFarmerId())
                .amount(amount)
                .paymentType(paymentType)
                .status(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        payment = paymentRepository.save(payment);

        order.setPaymentId(payment.getId());
        orderRepository.save(order);

        return payment;
    }

    public Payment uploadPaymentProof(String paymentId, String proofImageUrl, String paymentReference) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        payment.setProofImageUrl(proofImageUrl);
        payment.setPaymentReference(paymentReference);
        payment.setStatus(PaymentStatus.PROOF_UPLOADED);
        payment.setUpdatedAt(LocalDateTime.now());

        payment = paymentRepository.save(payment);

        // Update order status
        orderRepository.findById(payment.getOrderId()).ifPresent(order -> {
            order.setPaymentStatus(PaymentStatus.PROOF_UPLOADED);
            order.setStatus(OrderStatus.PAYMENT_SUBMITTED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Notify farmer
            notificationService.createNotification(order.getFarmerId(),
                    "Payment Proof Uploaded",
                    "Payment proof uploaded for order #" + order.getOrderId(),
                    "PAYMENT", paymentId, "PAYMENT");
        });

        return payment;
    }

    public Payment verifyPayment(String paymentId, String verifiedBy, boolean approved, String notes) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        payment.setStatus(approved ? PaymentStatus.VERIFIED : PaymentStatus.FAILED);
        payment.setVerifiedBy(verifiedBy);
        payment.setVerifiedAt(LocalDateTime.now());
        payment.setVerificationNotes(notes);
        payment.setUpdatedAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        // Update order
        orderRepository.findById(savedPayment.getOrderId()).ifPresent(order -> {
            order.setPaymentStatus(savedPayment.getStatus());
            if (approved) {
                order.setStatus(OrderStatus.PAYMENT_VERIFIED);
            }
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            // Notify buyer
            String message = approved ? "Your payment has been verified" : "Payment verification failed: " + notes;
            notificationService.createNotification(order.getBuyerId(),
                    approved ? "Payment Verified" : "Payment Failed",
                    message, "PAYMENT", paymentId, "PAYMENT");
        });

        return savedPayment;
    }

    public Payment getPayment(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }

    public Page<Payment> getPaymentsByPayer(String payerId, Pageable pageable) {
        return paymentRepository.findByPayerId(payerId, pageable);
    }

    public Page<Payment> getPaymentsByPayee(String payeeId, Pageable pageable) {
        return paymentRepository.findByPayeeId(payeeId, pageable);
    }

    public Page<Payment> getPaymentsByStatus(PaymentStatus status, Pageable pageable) {
        return paymentRepository.findByStatus(status, pageable);
    }
}
