package com.agrilink.service.smartfarm;

import com.agrilink.dto.response.SmartFarmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI Explanation Service — generates farmer-friendly paragraphs from structured data.
 * Uses Gemini API (Google AI) when configured.
 * NEVER invents data — only explains what is supplied.
 */
@Service
@Slf4j
public class AIExplanationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${agrilink.ai.api-key:}")
    private String aiApiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private static final String SYSTEM_PROMPT = """
            You are the AGRILINK Smart Agricultural AI Assistant.
            You receive REAL verified data from multiple external APIs (weather, soil, climate, market).
            
            Your job:
            1. Analyze ALL the supplied data comprehensively
            2. Based on current weather, soil properties, and climate history, recommend which crops are MOST SUITABLE for this farm location right now
            3. Provide actionable farming advice based on the data
            4. Warn about any weather risks (heavy rain, drought, extreme heat)
            5. If market data is available, suggest which crops have better prices
            6. Give irrigation and soil management tips based on soil composition
            
            STRICT RULES:
            - ONLY use the data that is supplied to you. Do NOT invent values.
            - If data is missing/unavailable, say so clearly.
            - Do NOT guarantee any prediction.
            - Use bullet points for key insights.
            - Keep response under 300 words.
            - When Tamil is requested, respond in simple Tamil/Thanglish.
            - When English is requested, respond in simple English.
            - Start with a brief one-line summary of farm conditions.
            - End with 2-3 actionable recommendations.
            """;

    public SmartFarmResponse generateExplanation(Map<String, Object> farmData, String language) {
        if (aiApiKey == null || aiApiKey.isBlank()) {
            return SmartFarmResponse.builder()
                    .source("GEMINI_AI").status("AI_NOT_CONFIGURED")
                    .retrievedAt(java.time.LocalDateTime.now())
                    .data(Map.of("message", "AI API key not configured. Set AI_API_KEY env var.")).build();
        }

        try {
            String langNote = "ta".equals(language) ? "Respond in simple Tamil/Thanglish." : "Respond in simple English.";
            String prompt = "Based on the following farm data, provide a smart farming summary for the farmer. " +
                    langNote + "\n\nFarm Data:\n" + formatDataForAI(farmData);

            Map<String, Object> request = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = GEMINI_URL + "?key=" + aiApiKey;
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Map.class);

            if (response.getBody() == null) {
                return SmartFarmResponse.apiError("GEMINI_AI", "Empty AI response");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            String explanation = "";
            if (candidates != null && !candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parts = content != null ? (List<Map<String, Object>>) content.get("parts") : null;
                if (parts != null && !parts.isEmpty()) {
                    explanation = (String) parts.get(0).get("text");
                }
            }

            List<String> basedOn = new ArrayList<>();
            if (farmData.containsKey("weather")) basedOn.add("OPEN_METEO");
            if (farmData.containsKey("climate")) basedOn.add("NASA_POWER");
            if (farmData.containsKey("soil")) basedOn.add("SOILGRIDS");
            if (farmData.containsKey("market")) basedOn.add("AGMARKNET");

            return SmartFarmResponse.builder()
                    .source("GEMINI_AI").status("GENERATED")
                    .retrievedAt(java.time.LocalDateTime.now())
                    .data(Map.of(
                            "explanation", explanation,
                            "language", language != null ? language : "en",
                            "basedOn", basedOn
                    )).build();
        } catch (Exception e) {
            log.error("AI Explanation error: {}", e.getMessage());
            return SmartFarmResponse.apiError("GEMINI_AI", e.getMessage());
        }
    }

    private String formatDataForAI(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            sb.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
        }
        return sb.toString();
    }
}
