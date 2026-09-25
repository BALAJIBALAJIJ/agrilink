package com.agrilink.repository;

import com.agrilink.model.BuyerProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface BuyerProfileRepository extends MongoRepository<BuyerProfile, String> {
    Optional<BuyerProfile> findByUserId(String userId);
}
