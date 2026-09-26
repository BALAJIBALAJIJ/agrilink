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
public class BiogasService {

    private final BiogasPlantRepository biogasPlantRepository;
    private final BiogasRequestRepository biogasRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<BiogasPlant> getAllPlants() {
        return biogasPlantRepository.findByActiveTrue();
    }

    public BiogasPlant getPlantByManagerId(String managerId) {
        return biogasPlantRepository.findByManagerId(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("No biogas plant assigned to this manager"));
    }

    public BiogasPlant findNearestPlant(double lat, double lon) {
        List<BiogasPlant> plants = biogasPlantRepository.findByActiveTrue();
        return plants.stream()
                .min(Comparator.comparingDouble(p -> calculateDistance(lat, lon,
                        p.getLocation().getLatitude(), p.getLocation().getLongitude())))
                .orElseThrow(() -> new ResourceNotFoundException("No biogas plants available"));
    }

    // ===== FARMER: CREATE REQUEST =====

    public BiogasRequest createRequest(String farmerId, BiogasRequest request) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        BiogasPlant nearestPlant = findNearestPlant(
                request.getLocation().getLatitude(), request.getLocation().getLongitude());

        request.setFarmerId(farmerId);
        request.setFarmerName(farmer.getFullName());
        request.setManagerId(nearestPlant.getManagerId());
        request.setCollectionLocation(nearestPlant.getLocation());
        request.setStatus(BiogasRequestStatus.SUBMITTED);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        BiogasRequest saved = biogasRequestRepository.save(request);

        if (nearestPlant.getManagerId() != null) {
            notificationService.createNotification(nearestPlant.getManagerId(),
                    "⚡ New Biogas Request",
                    farmer.getFullName() + " wants to sell " + request.getQuantityKg() + " kg " + request.getWasteType(),
                    "BIOGAS", saved.getId(), "BIOGAS_REQUEST");
        }

        log.info("Biogas request {} created by farmer {} → plant {}", saved.getId(), farmerId, nearestPlant.getName());
        return saved;
    }

    public Page<BiogasRequest> getFarmerRequests(String farmerId, Pageable pageable) {
        return biogasRequestRepository.findByFarmerId(farmerId, pageable);
    }

    public Page<BiogasRequest> getManagerRequests(String managerId, Pageable pageable) {
        return biogasRequestRepository.findByManagerId(managerId, pageable);
    }

    public List<BiogasRequest> getPendingRequests(String managerId) {
        // Get all SUBMITTED requests assigned to this manager
        return biogasRequestRepository.findByManagerId(managerId, Pageable.unpaged())
                .getContent().stream()
                .filter(r -> r.getStatus() == BiogasRequestStatus.SUBMITTED ||
                             r.getStatus() == BiogasRequestStatus.UNDER_REVIEW)
                .toList();
    }

    // ===== MANAGER: SEND OFFER =====

    public BiogasRequest sendOffer(String managerId, String requestId, double ratePerKg,
                                    double totalAmount, String suitability) {
        BiogasRequest request = biogasRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!managerId.equals(request.getManagerId())) {
            throw new ForbiddenException("Not authorized");
        }

        request.setOfferedRatePerKg(ratePerKg);
        request.setTotalPurchaseAmount(totalAmount);
        request.setSuitabilityStatus(suitability);
        request.setStatus(BiogasRequestStatus.OFFER_SENT);
        request.setUpdatedAt(LocalDateTime.now());
        biogasRequestRepository.save(request);

        notificationService.createNotification(request.getFarmerId(),
                "💰 Biogas Purchase Offer",
                "Biogas plant offered ₹" + totalAmount + " for " + request.getQuantityKg() + " kg " + request.getWasteType(),
                "BIOGAS", requestId, "BIOGAS_REQUEST");

        return request;
    }

    public BiogasRequest rejectRequest(String managerId, String requestId) {
        BiogasRequest request = biogasRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!managerId.equals(request.getManagerId())) {
            throw new ForbiddenException("Not authorized");
        }

        request.setSuitabilityStatus("NOT_SUITABLE");
        request.setStatus(BiogasRequestStatus.NOT_SUITABLE);
        request.setUpdatedAt(LocalDateTime.now());
        biogasRequestRepository.save(request);

        notificationService.createNotification(request.getFarmerId(),
                "❌ Biogas Request Rejected",
                "Your waste request for " + request.getWasteType() + " was marked as not suitable",
                "BIOGAS", requestId, "BIOGAS_REQUEST");

        return request;
    }

    // ===== FARMER: ACCEPT / REJECT =====

    public BiogasRequest farmerAcceptOffer(String farmerId, String requestId) {
        BiogasRequest request = biogasRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getFarmerId().equals(farmerId)) throw new ForbiddenException("Not authorized");
        if (request.getStatus() != BiogasRequestStatus.OFFER_SENT) throw new BadRequestException("No pending offer");

        request.setStatus(BiogasRequestStatus.FARMER_ACCEPTED);
        request.setUpdatedAt(LocalDateTime.now());
        biogasRequestRepository.save(request);

        notificationService.createNotification(request.getManagerId(),
                "✅ Farmer Accepted Offer",
                request.getFarmerName() + " accepted your offer for " + request.getWasteType(),
                "BIOGAS", requestId, "BIOGAS_REQUEST");

        return request;
    }

    public BiogasRequest farmerRejectOffer(String farmerId, String requestId) {
        BiogasRequest request = biogasRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getFarmerId().equals(farmerId)) throw new ForbiddenException("Not authorized");

        request.setStatus(BiogasRequestStatus.FARMER_REJECTED);
        request.setUpdatedAt(LocalDateTime.now());
        biogasRequestRepository.save(request);
        return request;
    }

    public BiogasRequest completePayment(String managerId, String requestId, double amount) {
        BiogasRequest request = biogasRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        request.setStatus(BiogasRequestStatus.COMPLETED);
        request.setTotalPurchaseAmount(amount);
        request.setUpdatedAt(LocalDateTime.now());
        biogasRequestRepository.save(request);

        notificationService.createNotification(request.getFarmerId(),
                "💰 Biogas Payment Received",
                "₹" + amount + " received for " + request.getWasteType() + " waste",
                "PAYMENT", requestId, "BIOGAS_REQUEST");

        return request;
    }

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
