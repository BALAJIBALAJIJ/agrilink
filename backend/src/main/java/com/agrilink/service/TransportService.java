package com.agrilink.service;

import com.agrilink.exception.*;
import com.agrilink.model.*;
import com.agrilink.model.enums.*;
import com.agrilink.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransportService {

    private final TransportRequestRepository transportRequestRepository;
    private final TransporterProfileRepository transporterProfileRepository;
    private final OrderRepository orderRepository;
    private final GpsLocationRepository gpsLocationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.routing.osrm-base-url}")
    private String osrmBaseUrl;

    public TransportRequest createTransportRequest(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.READY_FOR_PICKUP) {
            throw new BadRequestException("Order is not ready for pickup");
        }

        TransportRequest request = TransportRequest.builder()
                .orderId(orderId)
                .farmerId(order.getFarmerId())
                .farmerName(order.getFarmerName())
                .buyerId(order.getBuyerId())
                .buyerName(order.getBuyerName())
                .productName(order.getProductName())
                .quantity(order.getQuantity())
                .requiredCapacity(order.getQuantity())
                .pickupLocation(order.getPickupLocation())
                .deliveryLocation(order.getDeliveryLocation())
                .status(TransportStatus.REQUESTED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Calculate route if possible
        try {
            calculateRoute(request);
        } catch (Exception e) {
            log.warn("Route calculation failed, proceeding without route data", e);
        }

        request = transportRequestRepository.save(request);

        order.setStatus(OrderStatus.TRANSPORT_REQUESTED);
        order.setTransportRequestId(request.getId());
        orderRepository.save(order);

        // Notify eligible transporters
        notifyEligibleTransporters(request);

        return request;
    }

    public TransportRequest acceptTransportRequest(String transporterId, String requestId) {
        TransportRequest request = transportRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found"));

        if (request.getStatus() != TransportStatus.REQUESTED) {
            throw new BadRequestException("Transport request is no longer available");
        }

        User transporter = userRepository.findById(transporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Transporter not found"));

        if (transporter.getVerificationStatus() != VerificationStatus.APPROVED) {
            throw new ForbiddenException("Account must be verified");
        }

        TransporterProfile profile = transporterProfileRepository.findByUserId(transporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Transporter profile not found"));

        if (profile.isCurrentlyOnDelivery()) {
            throw new BadRequestException("You already have an active delivery. Complete it first.");
        }

        if (!profile.isDutyOn()) {
            throw new BadRequestException("You must be on duty to accept deliveries");
        }

        // Calculate transport charges
        double baseCharge = profile.getBaseCharge();
        double distanceCharge = request.getDistance() * profile.getPerKmCharge();
        double loadingCharge = profile.getLoadingCharge();
        double unloadingCharge = profile.getUnloadingCharge();
        double totalCharge = baseCharge + distanceCharge + loadingCharge + unloadingCharge;

        request.setTransporterId(transporterId);
        request.setTransporterName(transporter.getFullName());
        request.setBaseCharge(baseCharge);
        request.setDistanceCharge(distanceCharge);
        request.setLoadingCharge(loadingCharge);
        request.setUnloadingCharge(unloadingCharge);
        request.setTotalTransportCharge(totalCharge);
        request.setStatus(TransportStatus.ACCEPTED);
        request.setUpdatedAt(LocalDateTime.now());

        // Estimate fuel cost if mileage available
        if (profile.getVehicleMileage() > 0 && request.getDistance() > 0) {
            double estimatedFuel = request.getDistance() / profile.getVehicleMileage();
            request.setEstimatedFuelCost(estimatedFuel); // Litres, not cost (no fake prices)
        }

        transportRequestRepository.save(request);

        // Mark transporter as on delivery
        profile.setCurrentlyOnDelivery(true);
        profile.setActiveDeliveryId(requestId);
        transporterProfileRepository.save(profile);

        // Update order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setTransporterId(transporterId);
        order.setTransporterName(transporter.getFullName());
        order.setTransportCharge(totalCharge);
        order.setTotalAmount(order.getProductTotal() + totalCharge);
        order.setStatus(OrderStatus.TRANSPORT_ASSIGNED);
        orderRepository.save(order);

        // Notify farmer and buyer
        notificationService.createNotification(request.getFarmerId(), "Transporter Assigned",
                "Transporter " + transporter.getFullName() + " accepted your delivery",
                "TRANSPORT", requestId, "TRANSPORT_REQUEST");

        notificationService.createNotification(request.getBuyerId(), "Transporter Assigned",
                "A transporter has been assigned to your order",
                "TRANSPORT", requestId, "TRANSPORT_REQUEST");

        return request;
    }

    public void updateTransportStatus(String transporterId, String requestId, TransportStatus newStatus) {
        TransportRequest request = transportRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found"));

        if (!request.getTransporterId().equals(transporterId)) {
            throw new ForbiddenException("Not authorized");
        }

        request.setStatus(newStatus);
        request.setUpdatedAt(LocalDateTime.now());

        if (newStatus == TransportStatus.PICKED_UP) {
            request.setPickedUpAt(LocalDateTime.now());
        } else if (newStatus == TransportStatus.DELIVERED) {
            request.setDeliveredAt(LocalDateTime.now());
        }

        transportRequestRepository.save(request);

        // Update order status accordingly
        Order order = orderRepository.findById(request.getOrderId()).orElse(null);
        if (order != null) {
            OrderStatus orderStatus = mapTransportToOrderStatus(newStatus);
            if (orderStatus != null) {
                order.setStatus(orderStatus);
                if (newStatus == TransportStatus.DELIVERED) {
                    order.setDeliveredAt(LocalDateTime.now());
                }
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
            }
        }

        // Send real-time WebSocket update
        Map<String, Object> statusUpdate = Map.of(
                "requestId", requestId,
                "status", newStatus.name(),
                "timestamp", LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/transport/" + requestId, statusUpdate);

        // Notify farmer and buyer
        String statusMessage = getStatusMessage(newStatus);
        notificationService.createNotification(request.getFarmerId(), "Transport Update",
                statusMessage, "TRANSPORT", requestId, "TRANSPORT_REQUEST");
        notificationService.createNotification(request.getBuyerId(), "Transport Update",
                statusMessage, "TRANSPORT", requestId, "TRANSPORT_REQUEST");
    }

    public void confirmCashAndComplete(String transporterId, String requestId, double cashAmount) {
        TransportRequest request = transportRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found"));

        if (!request.getTransporterId().equals(transporterId)) {
            throw new ForbiddenException("Not authorized");
        }

        if (request.getStatus() != TransportStatus.DELIVERED) {
            throw new BadRequestException("Delivery must be marked as DELIVERED first");
        }

        request.setCashAmountReceived(cashAmount);
        request.setStatus(TransportStatus.COMPLETED);
        request.setUpdatedAt(LocalDateTime.now());
        transportRequestRepository.save(request);

        // Free up transporter
        transporterProfileRepository.findByUserId(transporterId).ifPresent(profile -> {
            profile.setCurrentlyOnDelivery(false);
            profile.setActiveDeliveryId(null);
            profile.setCompletedDeliveries(profile.getCompletedDeliveries() + 1);
            if (request.getDistance() > 0) {
                profile.setTotalDistanceTravelled(profile.getTotalDistanceTravelled() + request.getDistance());
            }
            profile.setTotalEarnings(profile.getTotalEarnings() + request.getTotalTransportCharge());
            transporterProfileRepository.save(profile);
        });

        // Update order to COMPLETED
        Order order = orderRepository.findById(request.getOrderId()).orElse(null);
        if (order != null) {
            order.setStatus(OrderStatus.COMPLETED);
            order.setPaymentStatus(PaymentStatus.VERIFIED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
        }

        // Notify all parties
        notificationService.createNotification(request.getFarmerId(), "✅ Order Completed",
                "Cash ₹" + cashAmount + " collected. Delivery completed!", "ORDER", requestId, "TRANSPORT_REQUEST");
        notificationService.createNotification(request.getBuyerId(), "✅ Order Completed",
                "Your order has been delivered. Cash ₹" + cashAmount + " paid.", "ORDER", requestId, "TRANSPORT_REQUEST");

        messagingTemplate.convertAndSend("/topic/transport/" + requestId, Map.of(
                "requestId", requestId, "status", "COMPLETED",
                "cashAmount", cashAmount, "timestamp", LocalDateTime.now().toString()));
    }

    public List<TransportRequest> getTransporterHistory(String transporterId) {
        return transportRequestRepository.findByTransporterIdOrderByCreatedAtDesc(transporterId);
    }

    public void updateGpsLocation(String transporterId, String requestId,
                                   double latitude, double longitude, double speed, double heading) {
        TransportRequest request = transportRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found"));

        if (!request.getTransporterId().equals(transporterId)) {
            throw new ForbiddenException("Not authorized");
        }

        GpsLocation gps = GpsLocation.builder()
                .transporterId(transporterId)
                .transportRequestId(requestId)
                .latitude(latitude)
                .longitude(longitude)
                .speed(speed)
                .heading(heading)
                .timestamp(LocalDateTime.now())
                .build();

        gpsLocationRepository.save(gps);

        // Update transporter current location
        transporterProfileRepository.findByUserId(transporterId).ifPresent(profile -> {
            GeoLocation currentLoc = profile.getCurrentLocation();
            if (currentLoc == null) currentLoc = new GeoLocation();
            currentLoc.setLatitude(latitude);
            currentLoc.setLongitude(longitude);
            profile.setCurrentLocation(currentLoc);
            transporterProfileRepository.save(profile);
        });

        // Broadcast via WebSocket
        Map<String, Object> locationUpdate = Map.of(
                "transporterId", transporterId,
                "requestId", requestId,
                "latitude", latitude,
                "longitude", longitude,
                "speed", speed,
                "heading", heading,
                "timestamp", LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/gps/" + requestId, locationUpdate);
    }

    public GpsLocation getLatestLocation(String requestId) {
        return gpsLocationRepository.findTopByTransportRequestIdOrderByTimestampDesc(requestId)
                .orElse(null);
    }

    public TransportRequest getTransportRequest(String requestId) {
        return transportRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found"));
    }

    public List<TransportRequest> getAvailableRequests() {
        return transportRequestRepository.findByStatus(TransportStatus.REQUESTED);
    }

    public void toggleDuty(String transporterId) {
        TransporterProfile profile = transporterProfileRepository.findByUserId(transporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Transporter profile not found"));

        if (profile.isCurrentlyOnDelivery() && profile.isDutyOn()) {
            throw new BadRequestException("Cannot go off duty during an active delivery");
        }

        profile.setDutyOn(!profile.isDutyOn());
        profile.setUpdatedAt(LocalDateTime.now());
        transporterProfileRepository.save(profile);
    }

    public boolean isDutyOn(String transporterId) {
        return transporterProfileRepository.findByUserId(transporterId)
                .map(TransporterProfile::isDutyOn)
                .orElse(false);
    }

    public TransportRequest getActiveDelivery(String transporterId) {
        TransporterProfile profile = transporterProfileRepository.findByUserId(transporterId).orElse(null);
        if (profile == null || !profile.isCurrentlyOnDelivery() || profile.getActiveDeliveryId() == null) return null;
        return transportRequestRepository.findById(profile.getActiveDeliveryId()).orElse(null);
    }

    private void calculateRoute(TransportRequest request) {
        try {
            if (request.getPickupLocation() == null || request.getDeliveryLocation() == null) return;

            String url = String.format("%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=polyline",
                    osrmBaseUrl,
                    request.getPickupLocation().getLongitude(),
                    request.getPickupLocation().getLatitude(),
                    request.getDeliveryLocation().getLongitude(),
                    request.getDeliveryLocation().getLatitude());

            RestTemplate restTemplate = new RestTemplate();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("routes")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
                if (!routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);
                    double distance = ((Number) route.get("distance")).doubleValue() / 1000.0; // Convert to km
                    double duration = ((Number) route.get("duration")).doubleValue() / 60.0; // Convert to minutes
                    String geometry = (String) route.get("geometry");

                    request.setDistance(Math.round(distance * 100.0) / 100.0);
                    request.setEstimatedDuration(Math.round(duration * 10.0) / 10.0);
                    request.setRouteGeometry(geometry);
                }
            }
        } catch (Exception e) {
            log.warn("OSRM route calculation failed: {}", e.getMessage());
        }
    }

    private void notifyEligibleTransporters(TransportRequest request) {
        List<TransporterProfile> available = transporterProfileRepository
                .findByDutyOnTrueAndCurrentlyOnDeliveryFalse();

        for (TransporterProfile profile : available) {
            User transporter = userRepository.findById(profile.getUserId()).orElse(null);
            if (transporter != null && transporter.getVerificationStatus() == VerificationStatus.APPROVED) {
                notificationService.createNotification(profile.getUserId(),
                        "New Delivery Available",
                        request.getQuantity() + "kg " + request.getProductName() +
                                " - Distance: " + request.getDistance() + "km",
                        "TRANSPORT", request.getId(), "TRANSPORT_REQUEST");
            }
        }
    }

    private OrderStatus mapTransportToOrderStatus(TransportStatus transportStatus) {
        return switch (transportStatus) {
            case GOING_TO_PICKUP -> OrderStatus.GOING_TO_PICKUP;
            case ARRIVED_AT_PICKUP -> OrderStatus.ARRIVED_AT_PICKUP;
            case PICKED_UP -> OrderStatus.PICKED_UP;
            case IN_TRANSIT -> OrderStatus.IN_TRANSIT;
            case NEAR_DESTINATION -> OrderStatus.NEAR_DESTINATION;
            case DELIVERED -> OrderStatus.DELIVERED;
            default -> null;
        };
    }

    private String getStatusMessage(TransportStatus status) {
        return switch (status) {
            case GOING_TO_PICKUP -> "Transporter is heading to pickup location";
            case ARRIVED_AT_PICKUP -> "Transporter has arrived at pickup location";
            case PICKED_UP -> "Products have been picked up";
            case IN_TRANSIT -> "Delivery is in transit";
            case NEAR_DESTINATION -> "Transporter is near the destination";
            case DELIVERED -> "Delivery completed successfully!";
            default -> "Transport status updated: " + status.name();
        };
    }
}
