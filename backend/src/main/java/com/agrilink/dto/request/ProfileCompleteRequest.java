package com.agrilink.dto.request;

import com.agrilink.model.GeoLocation;
import lombok.Data;

@Data
public class ProfileCompleteRequest {
    private String fullName;
    private String dateOfBirth;
    private String mobileNumber;
    private String email;
    private String role;
    private GeoLocation location;

    // Transporter-specific fields
    private String vehicleType;
    private String vehicleNumber;
    private String vehicleModel;
    private double vehicleCapacity;
    private String fuelType;
    private boolean refrigerated;
    private double vehicleMileage;
    private String serviceArea;
    private String workingHours;
    private double baseCharge;
    private double perKmCharge;
    private double loadingCharge;
    private double unloadingCharge;
}
