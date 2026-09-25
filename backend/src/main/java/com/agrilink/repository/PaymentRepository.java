package com.agrilink.repository;

import com.agrilink.model.Payment;
import com.agrilink.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByOrderId(String orderId);
    List<Payment> findByPayerIdAndStatus(String payerId, PaymentStatus status);
    Page<Payment> findByPayerId(String payerId, Pageable pageable);
    Page<Payment> findByPayeeId(String payeeId, Pageable pageable);
    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);
}
