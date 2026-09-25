package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "gpsLocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GpsLocation {

    @Id
    private String id;

    @Indexed
    private String transporterId;

    @Indexed
    private String transportRequestId;

    private double latitude;
    private double longitude;
    private double speed;
    private double heading;

    private LocalDateTime timestamp;
}
