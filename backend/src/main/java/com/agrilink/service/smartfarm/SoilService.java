package com.agrilink.service.smartfarm;

import com.agrilink.dto.response.SmartFarmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Soil data from SoilGrids/ISRIC REST API (free, no key).
 * https://rest.isric.org/soilgrids/v2.0/properties/query
 */
@Service
@Slf4j
public class SoilService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";

    public SmartFarmResponse getSoilData(double lat, double lon) {
        try {
            String url = SOILGRIDS_URL +
                    "?lon=" + lon +
                    "&lat=" + lat +
                    "&property=phh2o&property=soc&property=clay&property=sand&property=silt&property=nitrogen&property=ocd" +
                    "&depth=0-5cm&depth=5-15cm&depth=0-30cm" +
                    "&value=mean";

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                return SmartFarmResponse.unavailable("SOILGRIDS", "Empty response");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> properties = (Map<String, Object>) response.get("properties");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> layers = properties != null ? (List<Map<String, Object>>) properties.get("layers") : null;

            if (layers == null || layers.isEmpty()) {
                return SmartFarmResponse.unavailable("SOILGRIDS", "No soil data for this location");
            }

            Map<String, Object> soilData = new LinkedHashMap<>();

            for (Map<String, Object> layer : layers) {
                String name = (String) layer.get("name");
                String unit = "";
                @SuppressWarnings("unchecked")
                Map<String, Object> unitMap = (Map<String, Object>) layer.get("unit_measure");
                if (unitMap != null) {
                    unit = (String) unitMap.getOrDefault("mapped_units", "");
                }

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> depths = (List<Map<String, Object>>) layer.get("depths");
                if (depths != null && !depths.isEmpty()) {
                    // Use first available depth
                    Map<String, Object> firstDepth = depths.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> depthRange = (Map<String, Object>) firstDepth.get("range");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> values = (Map<String, Object>) firstDepth.get("values");

                    String depthLabel = depthRange != null ?
                            depthRange.get("top_depth") + "-" + depthRange.get("bottom_depth") + "cm" : "surface";

                    Map<String, Object> propData = new LinkedHashMap<>();
                    if (values != null && values.get("mean") != null) {
                        Number mean = (Number) values.get("mean");
                        double val = mean.doubleValue();

                        // SoilGrids returns pH * 10, soc in dg/kg, etc.
                        if ("phh2o".equals(name)) val = val / 10.0;
                        if ("soc".equals(name)) val = val / 10.0; // dg/kg -> g/kg
                        if ("ocd".equals(name)) val = val / 10.0;

                        propData.put("value", Math.round(val * 100.0) / 100.0);
                        propData.put("unit", unit);
                        propData.put("depth", depthLabel);
                    }

                    String displayName = switch (name) {
                        case "phh2o" -> "pH";
                        case "soc" -> "organicCarbon";
                        case "clay" -> "clay";
                        case "sand" -> "sand";
                        case "silt" -> "silt";
                        case "nitrogen" -> "nitrogen";
                        case "ocd" -> "organicCarbonDensity";
                        default -> name;
                    };
                    soilData.put(displayName, propData);
                }
            }

            soilData.put("latitude", lat);
            soilData.put("longitude", lon);

            return SmartFarmResponse.verified("SOILGRIDS", soilData);
        } catch (Exception e) {
            log.error("SoilGrids error: {}", e.getMessage());
            return SmartFarmResponse.apiError("SOILGRIDS", e.getMessage());
        }
    }
}
