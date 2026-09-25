package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;
    private String message;
    private String type; // ORDER, PAYMENT, TRANSPORT, VERIFICATION, DRY_UNIT, BIOGAS, SYSTEM
    private String referenceId; // Order ID, Transport ID, etc.
    private String referenceType; // ORDER, TRANSPORT_REQUEST, etc.

    private boolean read;

    @CreatedDate
    private LocalDateTime createdAt;
}
