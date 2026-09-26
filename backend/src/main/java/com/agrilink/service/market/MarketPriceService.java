package com.agrilink.service.market;

import com.agrilink.model.MarketPrice;
import com.agrilink.repository.MarketPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketPriceService {

    private final MarketPriceRepository marketPriceRepository;
    private final MongoTemplate mongoTemplate;

    // 20 Standard Tamil Nadu Districts supported
    public static final List<String> TAMIL_NADU_DISTRICTS = List.of(
            "Erode", "Salem", "Coimbatore", "Chennai", "Dindigul",
            "Tirupur", "Madurai", "Tiruchirappalli", "Dharmapuri", "Krishnagiri",
            "Namakkal", "Karur", "Thanjavur", "Tirunelveli", "Vellore",
            "Cuddalore", "Kanchipuram", "Villupuram", "Theni", "Nilgiris"
    );

    /**
     * Get market prices for a district and optional date from MongoDB.
     * Uses the latest available date for that district if date is omitted.
     * If no records exist in MongoDB, returns DATA_UNAVAILABLE status (no dummy data).
     */
    public Map<String, Object> getMarketPrices(String district, String date) {
        String targetDistrict = (district != null && !district.isBlank()) ? district.trim() : "Erode";
        Map<String, Object> response = new LinkedHashMap<>();

        // If date is not specified, query latest date available in MongoDB for this district
        String targetDate = date;
        if (targetDate == null || targetDate.isBlank()) {
            List<MarketPrice> latestRecords = marketPriceRepository.findDatesByDistrict(targetDistrict);
            if (!latestRecords.isEmpty() && latestRecords.get(0).getDate() != null) {
                targetDate = latestRecords.get(0).getDate();
            }
        }

        if (targetDate == null || targetDate.isBlank()) {
            // No records exist for this district in MongoDB
            response.put("district", targetDistrict);
            response.put("market", targetDistrict);
            response.put("date", null);
            response.put("source", "AGMARKNET / data.gov.in");
            response.put("status", "DATA_UNAVAILABLE");
            response.put("message", "No market-price data currently available in database for district: " + targetDistrict);
            response.put("fetchedAt", null);
            response.put("records", Collections.emptyList());
            return response;
        }

        List<MarketPrice> records = marketPriceRepository.findByDistrictRegexAndDate(targetDistrict, targetDate);

        if (records.isEmpty()) {
            response.put("district", targetDistrict);
            response.put("market", targetDistrict);
            response.put("date", targetDate);
            response.put("source", "AGMARKNET / data.gov.in");
            response.put("status", "DATA_UNAVAILABLE");
            response.put("message", "No records found for date: " + targetDate + " in district: " + targetDistrict);
            response.put("fetchedAt", null);
            response.put("records", Collections.emptyList());
            return response;
        }

        MarketPrice first = records.get(0);
        response.put("district", first.getDistrict());
        response.put("market", first.getMarket() != null ? first.getMarket() : first.getDistrict());
        response.put("date", targetDate);
        response.put("source", first.getSource() != null ? first.getSource() : "AGMARKNET / data.gov.in");
        response.put("status", "VERIFIED");
        response.put("fetchedAt", first.getFetchedAt());
        response.put("records", records);

        return response;
    }

    /**
     * Get real historical prices for a specific commodity and district from MongoDB.
     * Supports days: 7, 30, 90 (3 months).
     */
    public Map<String, Object> getPriceHistory(String district, String commodity, Integer days) {
        String targetDistrict = (district != null && !district.isBlank()) ? district.trim() : "Erode";
        String targetCommodity = (commodity != null && !commodity.isBlank()) ? commodity.trim() : "Tomato";
        int rangeDays = (days != null && days > 0) ? days : 30;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("district", targetDistrict);
        response.put("commodity", targetCommodity);
        response.put("days", rangeDays);

        // Calculate start date
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(rangeDays);

        List<MarketPrice> history = marketPriceRepository.findHistoryByDistrictAndCommodityAndDateRange(
                targetDistrict, targetCommodity, startDate.toString(), endDate.toString());

        // If history is empty with current date, check if earlier records exist
        if (history.isEmpty()) {
            List<MarketPrice> allCommodityHistory = marketPriceRepository.findByDistrictAndCommodityOrderByDateAsc(
                    targetDistrict, targetCommodity);
            if (!allCommodityHistory.isEmpty()) {
                // Get the last N records up to rangeDays
                int fromIndex = Math.max(0, allCommodityHistory.size() - rangeDays);
                history = allCommodityHistory.subList(fromIndex, allCommodityHistory.size());
            }
        }

        if (history.isEmpty()) {
            response.put("status", "DATA_UNAVAILABLE");
            response.put("message", "No historical records found for " + targetCommodity + " in " + targetDistrict);
            response.put("points", Collections.emptyList());
            return response;
        }

        List<Map<String, Object>> points = history.stream().map(hp -> {
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("date", hp.getDate());
            pt.put("price", hp.getPrice());
            pt.put("retailPriceMin", hp.getRetailPriceMin());
            pt.put("retailPriceMax", hp.getRetailPriceMax());
            pt.put("unit", hp.getUnit() != null ? hp.getUnit() : "1 kg");
            pt.put("market", hp.getMarket() != null ? hp.getMarket() : targetDistrict);
            pt.put("commodity", hp.getCommodity());
            return pt;
        }).collect(Collectors.toList());

        response.put("status", "VERIFIED");
        response.put("source", history.get(0).getSource());
        response.put("unit", history.get(0).getUnit() != null ? history.get(0).getUnit() : "1 kg");
        response.put("points", points);
        return response;
    }

    /**
     * Get distinct list of districts. Merges districts from database with supported districts.
     */
    public List<String> getAvailableDistricts() {
        Set<String> distinctFromDb = new LinkedHashSet<>(mongoTemplate.findDistinct("district", MarketPrice.class, String.class));
        Set<String> result = new LinkedHashSet<>();
        // Add DB districts first
        result.addAll(distinctFromDb);
        // Add standard Tamil Nadu districts
        result.addAll(TAMIL_NADU_DISTRICTS);
        return new ArrayList<>(result);
    }

    /**
     * Get distinct commodities for a given district.
     */
    public List<String> getAvailableCommodities(String district) {
        String targetDistrict = (district != null && !district.isBlank()) ? district.trim() : "Erode";
        Query query = new Query(Criteria.where("district").regex("^" + targetDistrict + "$", "i"));
        List<String> list = mongoTemplate.findDistinct(query, "commodity", MarketPrice.class, String.class);
        if (list.isEmpty()) {
            // Return common vegetable list if district has no records yet
            return List.of("Tomato", "Onion Big", "Onion Small", "Potato", "Brinjal", "Carrot", "Green Chilli", "Beetroot", "Cabbage", "Ladies Finger");
        }
        Collections.sort(list);
        return list;
    }

    /**
     * Save verified real market price records to MongoDB.
     * Prevents duplicates by checking (source, district, market, commodity, date).
     * Preserves all historical records.
     */
    public int saveVerifiedRecords(List<MarketPrice> records) {
        if (records == null || records.isEmpty()) {
            return 0;
        }

        int insertedCount = 0;
        Instant now = Instant.now();

        for (MarketPrice rec : records) {
            if (rec.getDistrict() == null || rec.getCommodity() == null || rec.getDate() == null || rec.getPrice() == null) {
                log.warn("Skipping invalid record: missing required fields {}", rec);
                continue;
            }

            String source = rec.getSource() != null ? rec.getSource() : "AGMARKNET / data.gov.in";
            String district = rec.getDistrict().trim();
            String market = rec.getMarket() != null ? rec.getMarket().trim() : district;
            String commodity = rec.getCommodity().trim();
            String date = rec.getDate().trim();

            Optional<MarketPrice> existing = marketPriceRepository
                    .findBySourceAndDistrictAndMarketAndCommodityAndDate(source, district, market, commodity, date);

            if (existing.isEmpty()) {
                rec.setSource(source);
                rec.setDistrict(district);
                rec.setMarket(market);
                rec.setCommodity(commodity);
                rec.setDate(date);
                rec.setStatus("VERIFIED");
                rec.setFetchedAt(now);
                if (rec.getUnit() == null || rec.getUnit().isBlank()) {
                    rec.setUnit("1 kg");
                }
                marketPriceRepository.save(rec);
                insertedCount++;
            } else {
                log.debug("Record already exists, skipping duplicate: {} | {} | {} | {}", district, market, commodity, date);
            }
        }

        log.info("Saved {} new verified market price records to MongoDB", insertedCount);
        return insertedCount;
    }
}
