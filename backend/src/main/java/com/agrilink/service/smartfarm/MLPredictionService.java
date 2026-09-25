package com.agrilink.service.smartfarm;

import com.agrilink.dto.response.SmartFarmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * ML Prediction Service — calls AGRILINK ML FastAPI service.
 * Returns MODEL_NOT_AVAILABLE when ML service is not deployed or model not trained.
 */
@Service
@Slf4j
public class MLPredictionService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${agrilink.ml.service-url:}")
    private String mlServiceUrl;

    public SmartFarmResponse predict(String endpoint, Map<String, Object> features) {
        if (mlServiceUrl == null || mlServiceUrl.isBlank()) {
            return SmartFarmResponse.modelNotAvailable(endpoint);
        }

        try {
            String url = mlServiceUrl + "/predict/" + endpoint;
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, features, Map.class);

            if (response == null) {
                return SmartFarmResponse.modelNotAvailable(endpoint);
            }

            String status = (String) response.getOrDefault("status", "MODELLED");
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("prediction", response.get("prediction"));
            result.put("confidence", response.get("confidence"));
            result.put("modelVersion", response.getOrDefault("modelVersion", "v1.0.0"));
            result.put("features", features);

            return SmartFarmResponse.builder()
                    .source("AGRILINK_ML").status(status)
                    .retrievedAt(java.time.LocalDateTime.now())
                    .data(result).build();
        } catch (Exception e) {
            log.warn("ML Service unavailable for {}: {}", endpoint, e.getMessage());
            return SmartFarmResponse.modelNotAvailable(endpoint);
        }
    }

    public SmartFarmResponse cropSuitability(Map<String, Object> features) {
        return predict("crop-suitability", features);
    }

    public SmartFarmResponse yieldPrediction(Map<String, Object> features) {
        return predict("yield", features);
    }

    public SmartFarmResponse pricePrediction(Map<String, Object> features) {
        return predict("price", features);
    }

    public SmartFarmResponse demandPrediction(Map<String, Object> features) {
        return predict("demand", features);
    }

    public SmartFarmResponse rainRisk(Map<String, Object> features) {
        return predict("rain-risk", features);
    }
}
