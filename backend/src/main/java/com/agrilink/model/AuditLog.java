package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "auditLogs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private String id;

    @Indexed
    private String adminId;
    private String adminName;

    private String action; // APPROVE_USER, REJECT_USER, SUSPEND_USER, CREATE_DRY_UNIT, etc.
    private String targetType; // USER, ORDER, PAYMENT, DRY_UNIT, BIOGAS
    private String targetId;
    private String details;

    @CreatedDate
    private LocalDateTime createdAt;
}
