package com.agrilink.service;

import com.agrilink.exception.*;
import com.agrilink.model.*;
import com.agrilink.model.enums.*;
import com.agrilink.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DryUnitService {

    private final DryUnitRepository dryUnitRepository;
    private final DryUnitRequestRepository dryUnitRequestRepository;
    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final NotificationService notificationService;

    // ===== DRY UNIT LOCATIONS =====

    public List<DryUnit> getAllDryUnits() {
        return dryUnitRepository.findByActiveTrue();
    }

    public DryUnit getDryUnitByManagerId(String managerId) {
        return dryUnitRepository.findByManagerId(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("No dry unit assigned to this manager"));
    }

    public DryUnit findNearestDryUnit(double lat, double lon) {
        List<DryUnit> units = dryUnitRepository.findByActiveTrue();
        return units.stream()
                .min(Comparator.comparingDouble(u -> calculateDistance(lat, lon,
                        u.getLocation().getLatitude(), u.getLocation().getLongitude())))
                .orElseThrow(() -> new ResourceNotFoundException("No dry units available"));
    }

    // ===== FARMER: CREATE REQUEST =====

    public DryUnitRequest createRequest(String farmerId, DryUnitRequest request) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        // Find nearest dry unit
        GeoLocation pickup = request.getPickupLocation();
        DryUnit nearestUnit = findNearestDryUnit(pickup.getLatitude(), pickup.getLongitude());

        request.setFarmerId(farmerId);
        request.setFarmerName(farmer.getFullName());
        request.setDryUnitId(nearestUnit.getId());
        request.setDryUnitName(nearestUnit.getName());
        request.setDryUnitLocation(nearestUnit.getLocation());
        request.setStatus(DryUnitRequestStatus.SUBMITTED);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        DryUnitRequest saved = dryUnitRequestRepository.save(request);

        // Notify dry unit manager
        if (nearestUnit.getManagerId() != null) {
            notificationService.createNotification(nearestUnit.getManagerId(),
                    "🏭 New Dry Unit Request",
                    farmer.getFullName() + " wants to send " + request.getQuantityKg() + " kg " + request.getVegetableName(),
                    "DRY_UNIT", saved.getId(), "DRY_UNIT_REQUEST");
        }

        log.info("Dry unit request {} created by farmer {} → unit {}", saved.getId(), farmerId, nearestUnit.getName());
        return saved;
    }

    // ===== FARMER: VIEW REQUESTS =====

    public Page<DryUnitRequest> getFarmerRequests(String farmerId, Pageable pageable) {
        return dryUnitRequestRepository.findByFarmerId(farmerId, pageable);
    }

    // ===== DRY UNIT MANAGER: VIEW REQUESTS =====

    public Page<DryUnitRequest> getUnitRequests(String managerId, Pageable pageable) {
        DryUnit unit = getDryUnitByManagerId(managerId);
        return dryUnitRequestRepository.findByDryUnitId(unit.getId(), pageable);
    }

    public List<DryUnitRequest> getPendingRequests(String managerId) {
        DryUnit unit = getDryUnitByManagerId(managerId);
        return dryUnitRequestRepository.findByDryUnitIdAndStatus(unit.getId(), DryUnitRequestStatus.SUBMITTED);
    }

    // ===== DRY UNIT MANAGER: SEND OFFER =====

    public DryUnitRequest sendOffer(String managerId, String requestId, double ratePerKg,
                                     double totalAmount, String processingTime) {
        DryUnitRequest request = dryUnitRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        DryUnit unit = getDryUnitByManagerId(managerId);
        if (!request.getDryUnitId().equals(unit.getId())) {
            throw new ForbiddenException("Not authorized for this request");
        }

        request.setOfferedRatePerKg(ratePerKg);
        request.setTotalOfferedAmount(totalAmount);
        request.setExpectedProcessingTime(processingTime);
        request.setStatus(DryUnitRequestStatus.OFFER_SENT);
        request.setUpdatedAt(LocalDateTime.now());
        dryUnitRequestRepository.save(request);

        notificationService.createNotification(request.getFarmerId(),
                "💰 Dry Unit Offer Received",
                unit.getName() + " offered ₹" + totalAmount + " for " + request.getQuantityKg() + " kg " + request.getVegetableName(),
                "DRY_UNIT", requestId, "DRY_UNIT_REQUEST");

        return request;
    }

    // ===== DRY UNIT MANAGER: REJECT =====

    public DryUnitRequest rejectRequest(String managerId, String requestId) {
        DryUnitRequest request = dryUnitRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        DryUnit unit = getDryUnitByManagerId(managerId);
        if (!request.getDryUnitId().equals(unit.getId())) {
            throw new ForbiddenException("Not authorized");
        }

        request.setStatus(DryUnitRequestStatus.CANCELLED);
        request.setUpdatedAt(LocalDateTime.now());
        dryUnitRequestRepository.save(request);

        notificationService.createNotification(request.getFarmerId(),
                "❌ Dry Unit Request Rejected",
                unit.getName() + " has rejected your request for " + request.getVegetableName(),
                "DRY_UNIT", requestId, "DRY_UNIT_REQUEST");

        return request;
    }

    // ===== FARMER: ACCEPT / REJECT OFFER =====

    public DryUnitRequest farmerAcceptOffer(String farmerId, String requestId) {
        DryUnitRequest request = dryUnitRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("Not authorized");
        }
        if (request.getStatus() != DryUnitRequestStatus.OFFER_SENT) {
            throw new BadRequestException("No pending offer to accept");
        }

        request.setStatus(DryUnitRequestStatus.FARMER_ACCEPTED);
        request.setUpdatedAt(LocalDateTime.now());
        dryUnitRequestRepository.save(request);

        // Notify dry unit
        notificationService.createNotification(getDryUnitByManagerId(request.getDryUnitId()) != null ?
                        dryUnitRepository.findById(request.getDryUnitId()).map(DryUnit::getManagerId).orElse(null) : null,
                "✅ Farmer Accepted Offer",
                request.getFarmerName() + " accepted your offer for " + request.getVegetableName(),
                "DRY_UNIT", requestId, "DRY_UNIT_REQUEST");

        return request;
    }

    public DryUnitRequest farmerRejectOffer(String farmerId, String requestId) {
        DryUnitRequest request = dryUnitRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("Not authorized");
        }

        request.setStatus(DryUnitRequestStatus.FARMER_REJECTED);
        request.setUpdatedAt(LocalDateTime.now());
        dryUnitRequestRepository.save(request);

        return request;
    }

    // ===== PAYMENT =====

    public DryUnitRequest completePayment(String managerId, String requestId, double amount) {
        DryUnitRequest request = dryUnitRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        request.setStatus(DryUnitRequestStatus.PAYMENT_COMPLETED);
        request.setTotalOfferedAmount(amount);
        request.setUpdatedAt(LocalDateTime.now());
        dryUnitRequestRepository.save(request);

        notificationService.createNotification(request.getFarmerId(),
                "💰 Payment Received",
                "₹" + amount + " received from " + request.getDryUnitName() + " for " + request.getVegetableName(),
                "PAYMENT", requestId, "DRY_UNIT_REQUEST");

        return request;
    }

    // ===== UTILS =====

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
