package com.agrilink.model;

import com.agrilink.model.enums.TransportStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "transportRequests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportRequest {

    @Id
    private String id;

    @Indexed
    private String orderId;

    @Indexed
    private String farmerId;
    private String farmerName;

    @Indexed
    private String buyerId;
    private String buyerName;

    @Indexed
    private String transporterId;
    private String transporterName;

    private String productName;
    private double quantity;
    private double requiredCapacity;

    private GeoLocation pickupLocation;
    private GeoLocation deliveryLocation;

    private double distance; // km
    private double estimatedDuration; // minutes
    private String routeGeometry; // Encoded polyline

    private double baseCharge;
    private double distanceCharge;
    private double loadingCharge;
    private double unloadingCharge;
    private double totalTransportCharge;
    private double estimatedFuelCost;

    private TransportStatus status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
}
