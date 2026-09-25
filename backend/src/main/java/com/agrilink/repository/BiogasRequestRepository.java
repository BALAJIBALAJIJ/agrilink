package com.agrilink.repository;

import com.agrilink.model.BiogasRequest;
import com.agrilink.model.enums.BiogasRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface BiogasRequestRepository extends MongoRepository<BiogasRequest, String> {
    Page<BiogasRequest> findByFarmerId(String farmerId, Pageable pageable);
    List<BiogasRequest> findByStatus(BiogasRequestStatus status);
    Page<BiogasRequest> findByManagerId(String managerId, Pageable pageable);
}
