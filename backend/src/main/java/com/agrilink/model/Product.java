package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    private String id;

    @Indexed
    private String farmerId;

    private String farmerName;
    private String farmerProfilePhotoUrl;

    private String category;
    private String vegetableName;
    private String vegetableNameTamil;
    private String imageUrl;

    private double quantityAvailable; // kg
    private double pricePerKg;
    private double minimumSaleQuantity; // kg
    private LocalDate harvestDate;
    private String description;

    private GeoLocation farmLocation;

    private boolean available;
    private boolean paused;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
