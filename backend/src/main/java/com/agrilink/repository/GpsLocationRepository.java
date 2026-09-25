package com.agrilink.repository;

import com.agrilink.model.GpsLocation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;

public interface GpsLocationRepository extends MongoRepository<GpsLocation, String> {
    Optional<GpsLocation> findTopByTransporterIdOrderByTimestampDesc(String transporterId);
    Optional<GpsLocation> findTopByTransportRequestIdOrderByTimestampDesc(String transportRequestId);
    List<GpsLocation> findByTransportRequestIdOrderByTimestampAsc(String transportRequestId);
}
