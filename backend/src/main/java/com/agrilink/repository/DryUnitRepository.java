package com.agrilink.repository;

import com.agrilink.model.DryUnit;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface DryUnitRepository extends MongoRepository<DryUnit, String> {
    List<DryUnit> findByActiveTrue();
    Optional<DryUnit> findByManagerId(String managerId);
}
