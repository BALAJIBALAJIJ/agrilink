package com.agrilink.repository;

import com.agrilink.model.DryUnitRequest;
import com.agrilink.model.enums.DryUnitRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface DryUnitRequestRepository extends MongoRepository<DryUnitRequest, String> {
    Page<DryUnitRequest> findByFarmerId(String farmerId, Pageable pageable);
    Page<DryUnitRequest> findByDryUnitId(String dryUnitId, Pageable pageable);
    List<DryUnitRequest> findByDryUnitIdAndStatus(String dryUnitId, DryUnitRequestStatus status);
}
