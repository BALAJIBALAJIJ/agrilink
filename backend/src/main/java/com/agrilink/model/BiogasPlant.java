package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "biogasPlants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiogasPlant {

    @Id
    private String id;
    private String name;
    private String district;
    private String address;
    private GeoLocation location;
    private String contactNumber;
    private String contactPerson;
    private double processingCapacityKg;
    private boolean active;
    private String managerId;
}
