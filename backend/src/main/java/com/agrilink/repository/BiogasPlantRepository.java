package com.agrilink.repository;

import com.agrilink.model.BiogasPlant;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface BiogasPlantRepository extends MongoRepository<BiogasPlant, String> {
    List<BiogasPlant> findByActiveTrue();
    Optional<BiogasPlant> findByManagerId(String managerId);
}
