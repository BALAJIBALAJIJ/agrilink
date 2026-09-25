package com.agrilink.repository;

import com.agrilink.model.TransportRequest;
import com.agrilink.model.enums.TransportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface TransportRequestRepository extends MongoRepository<TransportRequest, String> {
    Optional<TransportRequest> findByOrderId(String orderId);
    List<TransportRequest> findByTransporterIdAndStatus(String transporterId, TransportStatus status);
    Page<TransportRequest> findByTransporterId(String transporterId, Pageable pageable);
    List<TransportRequest> findByStatus(TransportStatus status);
    long countByTransporterIdAndStatusIn(String transporterId, List<TransportStatus> statuses);
}
