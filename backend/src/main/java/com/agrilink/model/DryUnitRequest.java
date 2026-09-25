package com.agrilink.model;

import com.agrilink.model.enums.DryUnitRequestStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "dryUnitRequests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DryUnitRequest {

    @Id
    private String id;

    @Indexed
    private String farmerId;
    private String farmerName;

    @Indexed
    private String dryUnitId;
    private String dryUnitName;

    private String vegetableName;
    private double quantityKg;
    private double requestedRatePerKg;
    private String description;
    private String imageUrl;
    private GeoLocation pickupLocation;

    // Dry unit offer
    private double offeredRatePerKg;
    private double totalOfferedAmount;
    private String expectedProcessingTime;
    private GeoLocation dryUnitLocation;

    // Transport
    private String transportRequestId;

    private DryUnitRequestStatus status;

    private String paymentId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
