package com.agrilink.model;

import com.agrilink.model.enums.BiogasRequestStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "biogasRequests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiogasRequest {

    @Id
    private String id;

    @Indexed
    private String farmerId;
    private String farmerName;

    private String wasteType; // PADDY_STRAW, SUGARCANE_WASTE, VEGETABLE_WASTE, COCONUT_WASTE, COW_DUNG, OTHER
    private double quantityKg;
    private String description;
    private String imageUrl;
    private GeoLocation location;

    // Biogas manager review
    private String managerId;
    private String suitabilityStatus; // SUITABLE, NOT_SUITABLE, NEEDS_REVIEW
    private double offeredRatePerKg;
    private double totalPurchaseAmount;
    private GeoLocation collectionLocation;
    private LocalDateTime expectedPickupDate;

    // Transport
    private String transportRequestId;

    private BiogasRequestStatus status;

    private String paymentId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
