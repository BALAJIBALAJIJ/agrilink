package com.agrilink.model;

import com.agrilink.model.enums.PaymentStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    private String id;

    @Indexed
    private String orderId;

    @Indexed
    private String payerId; // Buyer or Dry Unit or Biogas

    private String payeeId; // Farmer or Transporter

    private String paymentReference;
    private double amount;
    private String paymentType; // PRODUCT, TRANSPORT, DRY_UNIT, BIOGAS

    private String proofImageUrl; // Cloudinary URL
    private PaymentStatus status;

    private String verifiedBy; // Admin or authorized user
    private LocalDateTime verifiedAt;
    private String verificationNotes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
