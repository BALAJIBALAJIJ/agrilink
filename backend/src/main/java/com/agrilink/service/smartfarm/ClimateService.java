package com.agrilink.service.smartfarm;

import com.agrilink.dto.response.SmartFarmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Historical climate data from NASA POWER Daily API (free, no key).
 * https://power.larc.nasa.gov/docs/services/api/temporal/daily/
 */
@Service
@Slf4j
public class ClimateService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";

    public SmartFarmResponse getHistoricalClimate(double lat, double lon) {
        try {
            LocalDate end = LocalDate.now().minusDays(3);
            LocalDate start = end.minusDays(30);
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd");

            String url = NASA_POWER_URL +
                    "?start=" + start.format(fmt) +
                    "&end=" + end.format(fmt) +
                    "&latitude=" + lat +
                    "&longitude=" + lon +
                    "&community=ag" +
                    "&parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN" +
                    "&format=json";

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                return SmartFarmResponse.unavailable("NASA_POWER", "Empty response");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> properties = (Map<String, Object>) response.get("properties");
            @SuppressWarnings("unchecked")
            Map<String, Object> params = properties != null ? (Map<String, Object>) properties.get("parameter") : null;

            if (params == null) {
                return SmartFarmResponse.unavailable("NASA_POWER", "No parameter data");
            }

            // Calculate averages from the daily data
            Map<String, Object> climateData = new LinkedHashMap<>();
            climateData.put("period", start + " to " + end);
            climateData.put("avgTemperature", calcAvg(params.get("T2M")));
            climateData.put("avgMaxTemp", calcAvg(params.get("T2M_MAX")));
            climateData.put("avgMinTemp", calcAvg(params.get("T2M_MIN")));
            climateData.put("totalRainfall", calcSum(params.get("PRECTOTCORR")));
            climateData.put("avgHumidity", calcAvg(params.get("RH2M")));
            climateData.put("avgWindSpeed", calcAvg(params.get("WS2M")));
            climateData.put("avgSolarRadiation", calcAvg(params.get("ALLSKY_SFC_SW_DWN")));
            climateData.put("latitude", lat);
            climateData.put("longitude", lon);
            climateData.put("dataDate", end.toString());

            return SmartFarmResponse.builder()
                    .source("NASA_POWER").status("VERIFIED")
                    .retrievedAt(java.time.LocalDateTime.now())
                    .dataDate(start + " to " + end)
                    .data(climateData).build();
        } catch (Exception e) {
            log.error("NASA POWER error: {}", e.getMessage());
            return SmartFarmResponse.apiError("NASA_POWER", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Double calcAvg(Object paramData) {
        if (paramData == null) return null;
        Map<String, Object> map = (Map<String, Object>) paramData;
        double sum = 0; int count = 0;
        for (Object val : map.values()) {
            if (val instanceof Number n && n.doubleValue() > -990) {
                sum += n.doubleValue(); count++;
            }
        }
        return count > 0 ? Math.round(sum / count * 100.0) / 100.0 : null;
    }

    @SuppressWarnings("unchecked")
    private Double calcSum(Object paramData) {
        if (paramData == null) return null;
        Map<String, Object> map = (Map<String, Object>) paramData;
        double sum = 0;
        for (Object val : map.values()) {
            if (val instanceof Number n && n.doubleValue() > -990) {
                sum += n.doubleValue();
            }
        }
        return Math.round(sum * 100.0) / 100.0;
    }
}
