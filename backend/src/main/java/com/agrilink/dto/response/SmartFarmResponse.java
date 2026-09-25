package com.agrilink.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmartFarmResponse {
    private String source;
    private String status; // VERIFIED, MODELLED, ESTIMATED, DATA_UNAVAILABLE, MODEL_NOT_AVAILABLE, API_ERROR
    private LocalDateTime retrievedAt;
    private String dataDate;
    private Object data;

    public static SmartFarmResponse verified(String source, Object data) {
        return SmartFarmResponse.builder()
                .source(source).status("VERIFIED")
                .retrievedAt(LocalDateTime.now()).data(data).build();
    }

    public static SmartFarmResponse unavailable(String source, String reason) {
        return SmartFarmResponse.builder()
                .source(source).status("DATA_UNAVAILABLE")
                .retrievedAt(LocalDateTime.now())
                .data(Map.of("reason", reason)).build();
    }

    public static SmartFarmResponse apiError(String source, String error) {
        return SmartFarmResponse.builder()
                .source(source).status("API_ERROR")
                .retrievedAt(LocalDateTime.now())
                .data(Map.of("error", error)).build();
    }

    public static SmartFarmResponse modelNotAvailable(String model) {
        return SmartFarmResponse.builder()
                .source("AGRILINK_ML").status("MODEL_NOT_AVAILABLE")
                .retrievedAt(LocalDateTime.now())
                .data(Map.of("model", model, "message", "ML model not yet trained")).build();
    }
}
