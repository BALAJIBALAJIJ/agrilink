package com.agrilink.repository;

import com.agrilink.model.FarmerProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface FarmerProfileRepository extends MongoRepository<FarmerProfile, String> {
    Optional<FarmerProfile> findByUserId(String userId);
}
