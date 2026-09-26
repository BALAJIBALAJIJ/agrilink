package com.agrilink.service.smartfarm;

import com.agrilink.dto.response.SmartFarmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Government market price data from data.gov.in (AGMARKNET).
 * API key required from: https://data.gov.in/
 */
@Service
@Slf4j
public class MarketDataService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${agrilink.market.api-key:}")
    private String apiKey;

    private static final String MARKET_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.agrilink.repository.MarketPriceRepository marketPriceRepository;

    public SmartFarmResponse getMarketPrices(String commodity, String state) {
        if (apiKey == null || apiKey.isBlank()) {
            if (marketPriceRepository != null) {
                String comm = (commodity != null && !commodity.isBlank()) ? commodity.trim() : "Tomato";
                var saved = marketPriceRepository.findByDistrictRegexAndDate("Erode", java.time.LocalDate.now().toString());
                if (saved.isEmpty()) {
                    saved = marketPriceRepository.findByDistrictOrderByDateDescCommodityAsc("Erode");
                }
                if (!saved.isEmpty()) {
                    List<Map<String, Object>> marketData = new ArrayList<>();
                    for (com.agrilink.model.MarketPrice mp : saved) {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("commodity", mp.getCommodity());
                        item.put("market", mp.getMarket());
                        item.put("district", mp.getDistrict());
                        item.put("state", mp.getState() != null ? mp.getState() : "Tamil Nadu");
                        item.put("minPrice", mp.getRetailPriceMin() != null ? mp.getRetailPriceMin() : mp.getPrice());
                        item.put("maxPrice", mp.getRetailPriceMax() != null ? mp.getRetailPriceMax() : mp.getPrice());
                        item.put("modalPrice", mp.getPrice());
                        item.put("date", mp.getDate());
                        marketData.add(item);
                    }
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("commodity", comm);
                    result.put("totalRecords", marketData.size());
                    result.put("markets", marketData);
                    return SmartFarmResponse.verified("AGMARKNET", result);
                }
            }

            return SmartFarmResponse.builder()
                    .source("AGMARKNET").status("CONFIGURATION_REQUIRED")
                    .retrievedAt(java.time.LocalDateTime.now())
                    .data(Map.of("message", "Market API key not configured. Set MARKET_API_KEY env var.", 
                                 "configUrl", "https://data.gov.in/")).build();
        }

        try {
            String url = MARKET_API_URL +
                    "?api-key=" + apiKey +
                    "&format=json" +
                    "&limit=20" +
                    "&filters[commodity]=" + (commodity != null ? commodity : "Tomato") +
                    (state != null && !state.isBlank() ? "&filters[state]=" + state : "");

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                return SmartFarmResponse.unavailable("AGMARKNET", "Empty response");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> records = (List<Map<String, Object>>) response.get("records");
            if (records == null || records.isEmpty()) {
                return SmartFarmResponse.unavailable("AGMARKNET", "No market data for " + commodity);
            }

            List<Map<String, Object>> marketData = new ArrayList<>();
            for (Map<String, Object> record : records) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("commodity", record.get("commodity"));
                item.put("market", record.get("market"));
                item.put("district", record.get("district"));
                item.put("state", record.get("state"));
                item.put("variety", record.get("variety"));
                item.put("minPrice", parsePrice(record.get("min_price")));
                item.put("maxPrice", parsePrice(record.get("max_price")));
                item.put("modalPrice", parsePrice(record.get("modal_price")));
                item.put("date", record.get("arrival_date"));
                marketData.add(item);
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("commodity", commodity);
            result.put("totalRecords", response.get("total"));
            result.put("markets", marketData);

            return SmartFarmResponse.verified("AGMARKNET", result);
        } catch (Exception e) {
            log.error("Market API error: {}", e.getMessage());
            return SmartFarmResponse.apiError("AGMARKNET", e.getMessage());
        }
    }

    private Double parsePrice(Object val) {
        if (val == null) return null;
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
