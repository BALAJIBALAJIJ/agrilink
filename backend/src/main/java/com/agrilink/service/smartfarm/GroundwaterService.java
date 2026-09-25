package com.agrilink.service.smartfarm;

import com.agrilink.dto.response.SmartFarmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Groundwater data service.
 * India-WRIS / CGWB does not have a stable public REST API.
 * Returns DATA_UNAVAILABLE until a verified source is configured.
 */
@Service
@Slf4j
public class GroundwaterService {

    public SmartFarmResponse getGroundwaterData(double lat, double lon) {
        return SmartFarmResponse.builder()
                .source("CGWB_INDIA_WRIS")
                .status("DATA_UNAVAILABLE")
                .retrievedAt(java.time.LocalDateTime.now())
                .data(Map.of(
                        "message", "India-WRIS/CGWB does not provide a stable public REST API. District-level groundwater data requires manual integration.",
                        "latitude", lat,
                        "longitude", lon,
                        "note", "When CGWB data source is configured, real observation-well data will be shown here."
                )).build();
    }
}
