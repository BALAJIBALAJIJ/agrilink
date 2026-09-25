package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "dryUnits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DryUnit {

    @Id
    private String id;

    private String name;
    private String address;
    private String district;
    private GeoLocation location;
    private String contactNumber;
    private String contactPerson;
    private double processingCapacityKg;
    private boolean active;
    private String managerId; // DRY_UNIT_MANAGER user ID

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
