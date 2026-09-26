package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.service.market.MarketPriceService;
import com.agrilink.service.market.MarketPriceSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market-prices")
@RequiredArgsConstructor
@Slf4j
public class MarketPriceController {

    private final MarketPriceService marketPriceService;
    private final MarketPriceSyncService marketPriceSyncService;

    /**
     * GET /api/market-prices?district=Erode&date=2026-09-26
     * Retrieve real market prices from MongoDB for a district.
     * Defaults to the latest available date for that district if date is omitted.
     */
    @GetMapping
    public ResponseEntity<ApiResponse> getMarketPrices(
            @RequestParam(required = false, defaultValue = "Erode") String district,
            @RequestParam(required = false) String date) {
        log.debug("GET /api/market-prices district={}, date={}", district, date);
        Map<String, Object> data = marketPriceService.getMarketPrices(district, date);
        String status = (String) data.getOrDefault("status", "VERIFIED");
        String message = "DATA_UNAVAILABLE".equals(status)
                ? "No verified market-price records available for " + district
                : "Real market prices for " + district;
        return ResponseEntity.ok(ApiResponse.success(message, data));
    }

    /**
     * GET /api/market-prices/history?district=Erode&commodity=Tomato&days=30
     * Retrieve real historical price data for charts from MongoDB.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse> getPriceHistory(
            @RequestParam(required = false, defaultValue = "Erode") String district,
            @RequestParam(required = false, defaultValue = "Tomato") String commodity,
            @RequestParam(required = false, defaultValue = "30") Integer days) {
        log.debug("GET /api/market-prices/history district={}, commodity={}, days={}", district, commodity, days);
        Map<String, Object> data = marketPriceService.getPriceHistory(district, commodity, days);
        return ResponseEntity.ok(ApiResponse.success("Price history for " + commodity, data));
    }

    /**
     * GET /api/market-prices/districts
     * Retrieve all supported and available districts.
     */
    @GetMapping("/districts")
    public ResponseEntity<ApiResponse> getDistricts() {
        List<String> districts = marketPriceService.getAvailableDistricts();
        return ResponseEntity.ok(ApiResponse.success("Available districts", districts));
    }

    /**
     * GET /api/market-prices/commodities?district=Erode
     * Retrieve available commodities for a district.
     */
    @GetMapping("/commodities")
    public ResponseEntity<ApiResponse> getCommodities(
            @RequestParam(required = false, defaultValue = "Erode") String district) {
        List<String> commodities = marketPriceService.getAvailableCommodities(district);
        return ResponseEntity.ok(ApiResponse.success("Available commodities for " + district, commodities));
    }

    /**
     * POST /api/market-prices/sync
     * Trigger synchronization with real government source.
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse> triggerSync() {
        log.info("Manual synchronization triggered for market prices");
        Map<String, Object> result = marketPriceSyncService.synchronize();
        return ResponseEntity.ok(ApiResponse.success("Market sync executed", result));
    }
}
