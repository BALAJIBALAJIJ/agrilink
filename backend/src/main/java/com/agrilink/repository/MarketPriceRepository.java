package com.agrilink.repository;

import com.agrilink.model.MarketPrice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketPriceRepository extends MongoRepository<MarketPrice, String> {

    Optional<MarketPrice> findBySourceAndDistrictAndMarketAndCommodityAndDate(
            String source, String district, String market, String commodity, String date);

    List<MarketPrice> findByDistrictOrderByDateDescCommodityAsc(String district);

    List<MarketPrice> findByDistrictAndDateOrderByCommodityAsc(String district, String date);

    List<MarketPrice> findByDistrictAndCommodityOrderByDateAsc(String district, String commodity);

    @Query(value = "{ 'district': { $regex: ?0, $options: 'i' } }", fields = "{ 'date': 1 }", sort = "{ 'date': -1 }")
    List<MarketPrice> findDatesByDistrict(String district);

    @Query(value = "{ 'district': { $regex: ?0, $options: 'i' }, 'date': ?1 }", sort = "{ 'commodity': 1 }")
    List<MarketPrice> findByDistrictRegexAndDate(String districtRegex, String date);

    @Query(value = "{ 'district': { $regex: ?0, $options: 'i' }, 'commodity': { $regex: ?1, $options: 'i' }, 'date': { $gte: ?2, $lte: ?3 } }", sort = "{ 'date': 1 }")
    List<MarketPrice> findHistoryByDistrictAndCommodityAndDateRange(
            String districtRegex, String commodityRegex, String startDate, String endDate);
}
