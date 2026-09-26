package com.agrilink.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB document representing real vegetable market price records.
 * Uses collection 'market_prices' for all districts.
 * Unique constraint on (source, district, market, commodity, date) prevents duplicates
 * while preserving full historical records across dates.
 */
@Document(collection = "market_prices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@CompoundIndexes({
    @CompoundIndex(
        name = "uq_source_dist_mkt_comm_date",
        def = "{'source': 1, 'district': 1, 'market': 1, 'commodity': 1, 'date': 1}",
        unique = true
    ),
    @CompoundIndex(
        name = "idx_dist_date",
        def = "{'district': 1, 'date': -1}"
    ),
    @CompoundIndex(
        name = "idx_dist_comm_date",
        def = "{'district': 1, 'commodity': 1, 'date': 1}"
    )
})
public class MarketPrice {

    @Id
    private String id;

    private String state;

    @Indexed
    private String district;

    private String market;

    @Indexed
    private String commodity;

    private Double price;

    private Double retailPriceMin;

    private Double retailPriceMax;

    private String unit;

    @Indexed
    private String date; // Format: YYYY-MM-DD

    private String source;

    private String status; // VERIFIED, DATA_UNAVAILABLE, SOURCE_ERROR, NO_CURRENT_DATA

    private Instant fetchedAt;
}
