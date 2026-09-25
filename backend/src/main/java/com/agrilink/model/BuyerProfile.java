package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "buyerProfiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuyerProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private GeoLocation location;

    private int activeOrders;
    private int completedOrders;
    private double totalPurchases;
    private double averageRating;
    private int totalRatings;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
