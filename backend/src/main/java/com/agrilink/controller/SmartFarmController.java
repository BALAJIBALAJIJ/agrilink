package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.dto.response.SmartFarmResponse;
import com.agrilink.service.smartfarm.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/farmer/smart")
@RequiredArgsConstructor
public class SmartFarmController {

    private final WeatherService weatherService;
    private final ClimateService climateService;
    private final SoilService soilService;
    private final GroundwaterService groundwaterService;
    private final MarketDataService marketDataService;
    private final MLPredictionService mlPredictionService;
    private final AIExplanationService aiExplanationService;

    @GetMapping("/weather")
    public ResponseEntity<ApiResponse> getWeather(
            @RequestParam double lat, @RequestParam double lon) {
        SmartFarmResponse weather = weatherService.getCurrentWeather(lat, lon);
        return ResponseEntity.ok(ApiResponse.success("Weather data", weather));
    }

    @GetMapping("/climate")
    public ResponseEntity<ApiResponse> getClimate(
            @RequestParam double lat, @RequestParam double lon) {
        SmartFarmResponse climate = climateService.getHistoricalClimate(lat, lon);
        return ResponseEntity.ok(ApiResponse.success("Historical climate data", climate));
    }

    @GetMapping("/soil")
    public ResponseEntity<ApiResponse> getSoil(
            @RequestParam double lat, @RequestParam double lon) {
        SmartFarmResponse soil = soilService.getSoilData(lat, lon);
        return ResponseEntity.ok(ApiResponse.success("Soil data", soil));
    }

    @GetMapping("/groundwater")
    public ResponseEntity<ApiResponse> getGroundwater(
            @RequestParam double lat, @RequestParam double lon) {
        SmartFarmResponse gw = groundwaterService.getGroundwaterData(lat, lon);
        return ResponseEntity.ok(ApiResponse.success("Groundwater data", gw));
    }

    @GetMapping("/market")
    public ResponseEntity<ApiResponse> getMarketPrices(
            @RequestParam(defaultValue = "Tomato") String commodity,
            @RequestParam(required = false) String state) {
        SmartFarmResponse market = marketDataService.getMarketPrices(commodity, state);
        return ResponseEntity.ok(ApiResponse.success("Market price data", market));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse> getFullSummary(
            @RequestParam double lat, @RequestParam double lon,
            @RequestParam(defaultValue = "Tomato") String commodity,
            @RequestParam(required = false) String state,
            @RequestParam(defaultValue = "en") String lang) {

        // Fetch all data concurrently-ish
        SmartFarmResponse weather = weatherService.getCurrentWeather(lat, lon);
        SmartFarmResponse climate = climateService.getHistoricalClimate(lat, lon);
        SmartFarmResponse soil = soilService.getSoilData(lat, lon);
        SmartFarmResponse groundwater = groundwaterService.getGroundwaterData(lat, lon);
        SmartFarmResponse market = marketDataService.getMarketPrices(commodity, state);

        // Build ML features from real data
        Map<String, Object> mlFeatures = buildMLFeatures(weather, climate, soil, lat, lon);

        SmartFarmResponse cropSuitability = mlPredictionService.cropSuitability(mlFeatures);
        SmartFarmResponse yieldPred = mlPredictionService.yieldPrediction(mlFeatures);
        SmartFarmResponse pricePred = mlPredictionService.pricePrediction(mlFeatures);
        SmartFarmResponse demandPred = mlPredictionService.demandPrediction(mlFeatures);
        SmartFarmResponse rainRisk = mlPredictionService.rainRisk(mlFeatures);

        // Build AI input from real data only
        Map<String, Object> aiInput = new LinkedHashMap<>();
        if ("VERIFIED".equals(weather.getStatus())) aiInput.put("weather", weather.getData());
        if ("VERIFIED".equals(climate.getStatus())) aiInput.put("climate", climate.getData());
        if ("VERIFIED".equals(soil.getStatus())) aiInput.put("soil", soil.getData());
        if ("VERIFIED".equals(market.getStatus())) aiInput.put("market", market.getData());
        aiInput.put("crop", commodity);
        aiInput.put("farmLocation", Map.of("latitude", lat, "longitude", lon));

        SmartFarmResponse aiExplanation = aiExplanationService.generateExplanation(aiInput, lang);

        // Assemble full summary
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("weather", weather);
        summary.put("climate", climate);
        summary.put("soil", soil);
        summary.put("groundwater", groundwater);
        summary.put("market", market);
        summary.put("mlPredictions", Map.of(
                "cropSuitability", cropSuitability,
                "yield", yieldPred,
                "price", pricePred,
                "demand", demandPred,
                "rainRisk", rainRisk
        ));
        summary.put("aiExplanation", aiExplanation);

        return ResponseEntity.ok(ApiResponse.success("Smart Farm Intelligence summary", summary));
    }

    private Map<String, Object> buildMLFeatures(SmartFarmResponse weather, SmartFarmResponse climate,
                                                  SmartFarmResponse soil, double lat, double lon) {
        Map<String, Object> features = new LinkedHashMap<>();
        features.put("latitude", lat);
        features.put("longitude", lon);

        if ("VERIFIED".equals(weather.getStatus()) && weather.getData() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> wd = (Map<String, Object>) weather.getData();
            features.put("temperature", wd.get("temperature"));
            features.put("humidity", wd.get("humidity"));
            features.put("rainfall", wd.get("rain"));
            features.put("windSpeed", wd.get("windSpeed"));
        }

        if ("VERIFIED".equals(climate.getStatus()) && climate.getData() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cd = (Map<String, Object>) climate.getData();
            features.put("historicalRainfall", cd.get("totalRainfall"));
            features.put("historicalAvgTemp", cd.get("avgTemperature"));
        }

        if ("VERIFIED".equals(soil.getStatus()) && soil.getData() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> sd = (Map<String, Object>) soil.getData();
            if (sd.get("pH") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> ph = (Map<String, Object>) sd.get("pH");
                features.put("soilPh", ph.get("value"));
            }
            if (sd.get("organicCarbon") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> oc = (Map<String, Object>) sd.get("organicCarbon");
                features.put("soilOrganicCarbon", oc.get("value"));
            }
        }

        return features;
    }
}
