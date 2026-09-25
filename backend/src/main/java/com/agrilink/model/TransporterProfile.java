package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "transporterProfiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransporterProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    // Vehicle details
    private String vehicleType;
    @Indexed(unique = true, sparse = true)
    private String vehicleNumber;
    private String vehicleModel;
    private double vehicleCapacity; // kg
    private String fuelType;
    private boolean refrigerated;
    private double vehicleMileage; // km per litre

    // Verification documents - store Cloudinary URLs
    private String drivingLicenceUrl;
    private String vehicleRcUrl;
    private String insuranceUrl;
    private String vehiclePermitUrl;
    private String fitnessUrl;
    private LocalDateTime insuranceValidity;

    // Operational
    private GeoLocation currentLocation;
    private String serviceArea;
    private boolean dutyOn;
    private String workingHours;
    private double baseCharge;
    private double perKmCharge;
    private double loadingCharge;
    private double unloadingCharge;

    // Payment
    private String bankName;
    private String accountNumber; // Encrypted or masked in responses
    private String ifscCode;
    private String upiId;

    // Stats
    private boolean currentlyOnDelivery;
    private String activeDeliveryId;
    private int completedDeliveries;
    private double totalDistanceTravelled;
    private double totalEarnings;
    private double averageRating;
    private int totalRatings;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
