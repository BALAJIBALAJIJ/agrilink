package com.agrilink;

import com.agrilink.model.MarketPrice;
import com.agrilink.repository.MarketPriceRepository;
import com.agrilink.service.market.MarketPriceService;
import com.agrilink.service.market.MarketPriceSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class MarketPriceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MarketPriceRepository marketPriceRepository;

    @Autowired
    private MarketPriceService marketPriceService;

    @Autowired
    private MarketPriceSyncService marketPriceSyncService;

    @BeforeEach
    void setUp() {
        // Prepare verified historical and current records for Erode and Salem
        MarketPrice p1 = MarketPrice.builder()
                .state("Tamil Nadu")
                .district("Erode")
                .market("Erode")
                .commodity("Tomato")
                .price(26.0)
                .retailPriceMin(24.0)
                .retailPriceMax(30.0)
                .unit("1 kg")
                .date("2026-09-25")
                .source("AGMARKNET / data.gov.in")
                .status("VERIFIED")
                .fetchedAt(Instant.now())
                .build();

        MarketPrice p2 = MarketPrice.builder()
                .state("Tamil Nadu")
                .district("Erode")
                .market("Erode")
                .commodity("Tomato")
                .price(30.0)
                .retailPriceMin(28.0)
                .retailPriceMax(34.0)
                .unit("1 kg")
                .date("2026-09-26")
                .source("AGMARKNET / data.gov.in")
                .status("VERIFIED")
                .fetchedAt(Instant.now())
                .build();

        MarketPrice p3 = MarketPrice.builder()
                .state("Tamil Nadu")
                .district("Erode")
                .market("Erode")
                .commodity("Onion Big")
                .price(55.0)
                .retailPriceMin(50.0)
                .retailPriceMax(62.0)
                .unit("1 kg")
                .date("2026-09-26")
                .source("AGMARKNET / data.gov.in")
                .status("VERIFIED")
                .fetchedAt(Instant.now())
                .build();

        MarketPrice p4 = MarketPrice.builder()
                .state("Tamil Nadu")
                .district("Salem")
                .market("Salem")
                .commodity("Tomato")
                .price(28.0)
                .retailPriceMin(25.0)
                .retailPriceMax(32.0)
                .unit("1 kg")
                .date("2026-09-26")
                .source("AGMARKNET / data.gov.in")
                .status("VERIFIED")
                .fetchedAt(Instant.now())
                .build();

        marketPriceService.saveVerifiedRecords(List.of(p1, p2, p3, p4));
    }

    @Test
    @DisplayName("Test 1: Historical records preservation across days")
    void testHistoricalRecordsPreservation() {
        // Both 2026-09-25 and 2026-09-26 Tomato records must remain in MongoDB
        var rec1 = marketPriceRepository.findBySourceAndDistrictAndMarketAndCommodityAndDate(
                "AGMARKNET / data.gov.in", "Erode", "Erode", "Tomato", "2026-09-25");
        var rec2 = marketPriceRepository.findBySourceAndDistrictAndMarketAndCommodityAndDate(
                "AGMARKNET / data.gov.in", "Erode", "Erode", "Tomato", "2026-09-26");

        assertTrue(rec1.isPresent(), "Record for 2026-09-25 must exist in MongoDB");
        assertTrue(rec2.isPresent(), "Record for 2026-09-26 must exist in MongoDB");
        assertEquals(26.0, rec1.get().getPrice());
        assertEquals(30.0, rec2.get().getPrice());
    }

    @Test
    @DisplayName("Test 2: Duplicate prevention on unique key")
    void testDuplicatePrevention() {
        // Attempting to re-save the exact same record
        MarketPrice duplicate = MarketPrice.builder()
                .state("Tamil Nadu")
                .district("Erode")
                .market("Erode")
                .commodity("Tomato")
                .price(30.0)
                .unit("1 kg")
                .date("2026-09-26")
                .source("AGMARKNET / data.gov.in")
                .status("VERIFIED")
                .build();

        int inserted = marketPriceService.saveVerifiedRecords(List.of(duplicate));
        assertEquals(0, inserted, "Duplicate record must NOT be inserted");
    }

    @Test
    @DisplayName("Test 3: REST API GET /api/market-prices?district=Erode")
    void testGetMarketPricesErode() throws Exception {
        mockMvc.perform(get("/api/market-prices?district=Erode")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.district").value("Erode"))
                .andExpect(jsonPath("$.data.status").value("VERIFIED"))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @DisplayName("Test 4: REST API GET /api/market-prices?district=Salem")
    void testGetMarketPricesSalem() throws Exception {
        mockMvc.perform(get("/api/market-prices?district=Salem")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.district").value("Salem"))
                .andExpect(jsonPath("$.data.status").value("VERIFIED"));
    }

    @Test
    @DisplayName("Test 5: REST API GET /api/market-prices/history?district=Erode&commodity=Tomato")
    void testGetPriceHistory() throws Exception {
        mockMvc.perform(get("/api/market-prices/history?district=Erode&commodity=Tomato&days=30")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.district").value("Erode"))
                .andExpect(jsonPath("$.data.commodity").value("Tomato"))
                .andExpect(jsonPath("$.data.points").isArray())
                .andExpect(jsonPath("$.data.points[0].price").exists())
                .andExpect(jsonPath("$.data.points[0].date").exists());
    }

    @Test
    @DisplayName("Test 6: Handling unrecorded district returns DATA_UNAVAILABLE")
    void testDataUnavailableForUnrecordedDistrict() throws Exception {
        mockMvc.perform(get("/api/market-prices?district=UnknownDistrictXYZ")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DATA_UNAVAILABLE"))
                .andExpect(jsonPath("$.data.records").isEmpty());
    }

    @Test
    @DisplayName("Test 7: Districts and Commodities metadata endpoints")
    void testMetadataEndpoints() throws Exception {
        mockMvc.perform(get("/api/market-prices/districts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0]").exists());

        mockMvc.perform(get("/api/market-prices/commodities?district=Erode"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("Test 8: Daily synchronization execution")
    void testSyncExecution() {
        Map<String, Object> result = marketPriceSyncService.synchronize();
        assertNotNull(result, "Sync result should not be null");
        assertTrue(result.containsKey("status"), "Sync result should contain status");
    }
}
