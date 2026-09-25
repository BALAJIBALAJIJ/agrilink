package com.agrilink.repository;

import com.agrilink.model.TransporterProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface TransporterProfileRepository extends MongoRepository<TransporterProfile, String> {
    Optional<TransporterProfile> findByUserId(String userId);
    Optional<TransporterProfile> findByVehicleNumber(String vehicleNumber);
    List<TransporterProfile> findByDutyOnTrueAndCurrentlyOnDeliveryFalse();
}
