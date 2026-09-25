package com.agrilink.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoLocation {
    private double latitude;
    private double longitude;
    private String address;
    private String district;
    private String state;
    private String pincode;
}
