package com.agrilink.service.market;

import com.agrilink.model.MarketPrice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketPriceSyncService {

    private final MarketPriceService marketPriceService;

    @Value("${agrilink.market.api-key:}")
    private String apiKey;

    @Value("${market.sync.cron:0 0 6 * * *}")
    private String syncCron;

    private static final String MARKET_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

    /**
     * Automatic daily synchronization scheduled job.
     * Schedule configured through environment/application config (default: 06:00 AM daily).
     */
    @Scheduled(cron = "${market.sync.cron:0 0 6 * * *}")
    public void runDailyMarketSync() {
        log.info("Starting scheduled daily market-price synchronization (cron: {})...", syncCron);
        Map<String, Object> result = synchronize();
        log.info("Daily market sync completed: {}", result);
    }

    /**
     * Execute synchronization from the verified government source (data.gov.in / AGMARKNET).
     * Connects, fetches latest data, validates, normalizes, and saves to MongoDB.
     * Preserves historical records, prevents duplicates, and never fabricates prices.
     */
    public Map<String, Object> synchronize() {
        Map<String, Object> result = new LinkedHashMap<>();
        Instant syncTime = Instant.now();
        result.put("source", "AGMARKNET / data.gov.in");
        result.put("syncTime", syncTime);

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Market synchronization skipped: MARKET_API_KEY environment variable is not configured. No fake data created.");
            result.put("status", "CONFIGURATION_REQUIRED");
            result.put("message", "Market API key not configured (MARKET_API_KEY). Real source cannot be queried without valid credentials.");
            result.put("recordsInserted", 0);
            return result;
        }

        try {
            // Setup RestTemplate with 15-second connect and read timeout
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(15000);
            factory.setReadTimeout(20000);
            RestTemplate restTemplate = new RestTemplate(factory);

            // Fetch Tamil Nadu market arrivals
            String url = MARKET_API_URL +
                    "?api-key=" + apiKey.trim() +
                    "&format=json" +
                    "&limit=100" +
                    "&filters[state]=Tamil%20Nadu";

            log.info("Connecting to real government market-data API: {}", MARKET_API_URL);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> responseEntity = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = responseEntity.getBody();

            if (body == null) {
                log.error("Received empty response from data.gov.in");
                result.put("status", "SOURCE_ERROR");
                result.put("message", "Empty response from data.gov.in");
                result.put("recordsInserted", 0);
                return result;
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> records = (List<Map<String, Object>>) body.get("records");
            if (records == null || records.isEmpty()) {
                log.info("No current market-price records returned from data.gov.in for Tamil Nadu");
                result.put("status", "NO_CURRENT_DATA");
                result.put("message", "No records published by source for current query");
                result.put("recordsInserted", 0);
                return result;
            }

            List<MarketPrice> normalizedList = new ArrayList<>();
            for (Map<String, Object> raw : records) {
                MarketPrice mp = normalizeRecord(raw, syncTime);
                if (mp != null) {
                    normalizedList.add(mp);
                }
            }

            int savedCount = marketPriceService.saveVerifiedRecords(normalizedList);
            result.put("status", "VERIFIED");
            result.put("recordsFound", records.size());
            result.put("recordsInserted", savedCount);
            result.put("message", "Successfully synchronized " + savedCount + " new real records into MongoDB");
            return result;

        } catch (Exception e) {
            log.error("Failed to synchronize market data from source: {}", e.getMessage());
            result.put("status", "SOURCE_ERROR");
            result.put("message", "Error connecting to government source: " + e.getMessage());
            result.put("recordsInserted", 0);
            return result;
        }
    }

    /**
     * Normalize a raw data.gov.in record into standard MarketPrice entity.
     */
    private MarketPrice normalizeRecord(Map<String, Object> raw, Instant syncTime) {
        try {
            String state = getStr(raw.get("state"), "Tamil Nadu");
            String district = normalizeName(getStr(raw.get("district"), null));
            String market = normalizeName(getStr(raw.get("market"), district));
            String commodity = normalizeName(getStr(raw.get("commodity"), null));

            if (district == null || commodity == null) {
                return null;
            }

            Double minP = parsePrice(raw.get("min_price"));
            Double maxP = parsePrice(raw.get("max_price"));
            Double modalP = parsePrice(raw.get("modal_price"));

            if (modalP == null && minP == null && maxP == null) {
                return null;
            }

            // In AGMARKNET, prices are typically reported per Quintal (100 kg)
            // If price > 100, convert to per 1 kg for farmer dashboard clarity
            Double pricePerKg = modalP;
            Double retailMin = minP;
            Double retailMax = maxP;

            if (modalP != null && modalP > 150) {
                pricePerKg = Math.round((modalP / 100.0) * 10.0) / 10.0;
            }
            if (minP != null && minP > 150) {
                retailMin = Math.round((minP / 100.0) * 10.0) / 10.0;
            }
            if (maxP != null && maxP > 150) {
                retailMax = Math.round((maxP / 100.0) * 10.0) / 10.0;
            }

            String rawDate = getStr(raw.get("arrival_date"), null);
            String normalizedDate = normalizeDate(rawDate);

            return MarketPrice.builder()
                    .state(state)
                    .district(district)
                    .market(market)
                    .commodity(commodity)
                    .price(pricePerKg)
                    .retailPriceMin(retailMin)
                    .retailPriceMax(retailMax)
                    .unit("1 kg")
                    .date(normalizedDate)
                    .source("AGMARKNET / data.gov.in")
                    .status("VERIFIED")
                    .fetchedAt(syncTime)
                    .build();

        } catch (Exception e) {
            log.warn("Error parsing record {}: {}", raw, e.getMessage());
            return null;
        }
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) return null;
        String trimmed = name.trim();
        // Capitalize each word properly
        String[] words = trimmed.toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0)))
                  .append(w.substring(1))
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }

    private String normalizeDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return LocalDate.now().toString();
        }
        try {
            // Check DD/MM/YYYY
            if (dateStr.contains("/")) {
                String[] parts = dateStr.trim().split("/");
                if (parts.length == 3) {
                    int day = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    return String.format("%04d-%02d-%02d", year, month, day);
                }
            }
            // Check YYYY-MM-DD
            if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return dateStr.trim();
            }
        } catch (Exception ignored) {}
        return LocalDate.now().toString();
    }

    private Double parsePrice(Object val) {
        if (val == null) return null;
        try {
            return Double.parseDouble(val.toString().replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            return null;
        }
    }

    private String getStr(Object obj, String fallback) {
        if (obj == null) return fallback;
        String s = obj.toString().trim();
        return s.isEmpty() ? fallback : s;
    }
}
