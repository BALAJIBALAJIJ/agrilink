package com.agrilink.service;

import com.agrilink.dto.request.OrderRequest;
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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final TransporterProfileRepository transporterProfileRepository;
    private final NotificationService notificationService;

    private static final AtomicLong orderCounter = new AtomicLong(System.currentTimeMillis() % 10000);

    public Order createOrder(String buyerId, OrderRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found"));

        if (buyer.getVerificationStatus() != VerificationStatus.APPROVED) {
            throw new ForbiddenException("Account must be verified to place orders");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.isAvailable() || product.isPaused()) {
            throw new BadRequestException("Product is not available");
        }

        if (request.getQuantity() < product.getMinimumSaleQuantity()) {
            throw new BadRequestException("Minimum order quantity is " + product.getMinimumSaleQuantity() + " kg");
        }

        if (request.getQuantity() > product.getQuantityAvailable()) {
            throw new BadRequestException("Requested quantity exceeds available stock");
        }

        // Generate unique order ID
        String orderId = generateOrderId();

        double productTotal = request.getQuantity() * product.getPricePerKg();

        Order order = Order.builder()
                .orderId(orderId)
                .buyerId(buyerId)
                .buyerName(buyer.getFullName())
                .farmerId(product.getFarmerId())
                .farmerName(product.getFarmerName())
                .productId(product.getId())
                .productName(product.getVegetableName())
                .productImageUrl(product.getImageUrl())
                .quantity(request.getQuantity())
                .pricePerKg(product.getPricePerKg())
                .productTotal(productTotal)
                .pickupLocation(product.getFarmLocation())
                .deliveryLocation(request.getDeliveryLocation())
                .status(OrderStatus.READY_FOR_PICKUP) // Cash on Delivery - skip payment
                .paymentStatus(PaymentStatus.COD) // Cash on Delivery
                .totalAmount(productTotal) // Transport charge added later
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        order = orderRepository.save(order);

        // Update product quantity
        product.setQuantityAvailable(product.getQuantityAvailable() - request.getQuantity());
        if (product.getQuantityAvailable() <= 0) {
            product.setAvailable(false);
        }
        productRepository.save(product);

        // Notify farmer
        notificationService.createNotification(product.getFarmerId(),
                "New Order Received (Cash on Delivery)",
                "New order #" + orderId + " for " + request.getQuantity() + "kg of " + product.getVegetableName(),
                "ORDER", order.getId(), "ORDER");

        // AUTO-CREATE TRANSPORT REQUEST immediately
        try {
            autoCreateTransportRequest(order);
        } catch (Exception e) {
            log.warn("Auto transport request failed, manual trigger needed: {}", e.getMessage());
        }

        return order;
    }

    private void autoCreateTransportRequest(Order order) {
        // Fetch phone numbers
        String farmerPhone = userRepository.findById(order.getFarmerId())
                .map(User::getMobileNumber).orElse("");
        String buyerPhone = userRepository.findById(order.getBuyerId())
                .map(User::getMobileNumber).orElse("");

        TransportRequest transportReq = TransportRequest.builder()
                .orderId(order.getId())
                .farmerId(order.getFarmerId())
                .farmerName(order.getFarmerName())
                .farmerPhone(farmerPhone)
                .buyerId(order.getBuyerId())
                .buyerName(order.getBuyerName())
                .buyerPhone(buyerPhone)
                .productName(order.getProductName())
                .productImageUrl(order.getProductImageUrl())
                .quantity(order.getQuantity())
                .requiredCapacity(order.getQuantity())
                .productTotal(order.getProductTotal())
                .pickupLocation(order.getPickupLocation())
                .deliveryLocation(order.getDeliveryLocation())
                .status(TransportStatus.REQUESTED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        transportReq = transportRequestRepository.save(transportReq);

        order.setStatus(OrderStatus.TRANSPORT_REQUESTED);
        order.setTransportRequestId(transportReq.getId());
        orderRepository.save(order);

        // Notify eligible transporters
        List<TransporterProfile> available = transporterProfileRepository
                .findByDutyOnTrueAndCurrentlyOnDeliveryFalse();
        for (TransporterProfile profile : available) {
            User transporter = userRepository.findById(profile.getUserId()).orElse(null);
            if (transporter != null && transporter.getVerificationStatus() == VerificationStatus.APPROVED) {
                notificationService.createNotification(profile.getUserId(),
                        "🚛 New Delivery Available!",
                        order.getQuantity() + "kg " + order.getProductName() + " - Cash on Delivery",
                        "TRANSPORT", transportReq.getId(), "TRANSPORT_REQUEST");
            }
        }
    }

    public Order getOrder(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    public Order getOrderByOrderId(String orderId) {
        return orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    public Page<Order> getFarmerOrders(String farmerId, Pageable pageable) {
        return orderRepository.findByFarmerId(farmerId, pageable);
    }

    public Page<Order> getBuyerOrders(String buyerId, Pageable pageable) {
        return orderRepository.findByBuyerId(buyerId, pageable);
    }

    public Order acceptOrder(String farmerId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("Not authorized");
        }

        if (order.getStatus() != OrderStatus.PAYMENT_VERIFIED) {
            throw new BadRequestException("Order payment must be verified before acceptance");
        }

        order.setStatus(OrderStatus.FARMER_ACCEPTED);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        // Notify buyer
        notificationService.createNotification(order.getBuyerId(),
                "Order Accepted",
                "Your order #" + order.getOrderId() + " has been accepted by " + order.getFarmerName(),
                "ORDER", order.getId(), "ORDER");

        // Move to ready for pickup
        order.setStatus(OrderStatus.READY_FOR_PICKUP);
        order = orderRepository.save(order);

        return order;
    }

    public Order rejectOrder(String farmerId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("Not authorized");
        }

        order.setStatus(OrderStatus.FARMER_REJECTED);
        order.setUpdatedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);

        // Restore product quantity
        productRepository.findById(savedOrder.getProductId()).ifPresent(product -> {
            product.setQuantityAvailable(product.getQuantityAvailable() + savedOrder.getQuantity());
            product.setAvailable(true);
            productRepository.save(product);
        });

        // Notify buyer
        notificationService.createNotification(savedOrder.getBuyerId(),
                "Order Rejected",
                "Your order #" + savedOrder.getOrderId() + " has been rejected by the farmer.",
                "ORDER", savedOrder.getId(), "ORDER");

        return savedOrder;
    }

    public Order updateOrderStatus(String orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        validateStateTransition(order.getStatus(), newStatus);

        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        return orderRepository.save(order);
    }

    private void validateStateTransition(OrderStatus current, OrderStatus next) {
        // Define valid transitions
        boolean valid = switch (current) {
            case PENDING_PAYMENT -> next == OrderStatus.PAYMENT_SUBMITTED || next == OrderStatus.CANCELLED;
            case PAYMENT_SUBMITTED -> next == OrderStatus.PAYMENT_VERIFIED || next == OrderStatus.CANCELLED;
            case PAYMENT_VERIFIED -> next == OrderStatus.FARMER_ACCEPTED || next == OrderStatus.FARMER_REJECTED;
            case FARMER_ACCEPTED -> next == OrderStatus.READY_FOR_PICKUP;
            case READY_FOR_PICKUP -> next == OrderStatus.TRANSPORT_REQUESTED || next == OrderStatus.TRANSPORT_ASSIGNED;
            case TRANSPORT_REQUESTED -> next == OrderStatus.TRANSPORT_ASSIGNED;
            case TRANSPORT_ASSIGNED -> next == OrderStatus.GOING_TO_PICKUP;
            case GOING_TO_PICKUP -> next == OrderStatus.ARRIVED_AT_PICKUP;
            case ARRIVED_AT_PICKUP -> next == OrderStatus.PICKED_UP;
            case PICKED_UP -> next == OrderStatus.IN_TRANSIT;
            case IN_TRANSIT -> next == OrderStatus.NEAR_DESTINATION || next == OrderStatus.DELIVERED;
            case NEAR_DESTINATION -> next == OrderStatus.DELIVERED;
            case DELIVERED -> next == OrderStatus.COMPLETED;
            default -> false;
        };

        if (!valid) {
            throw new BadRequestException("Invalid state transition from " + current + " to " + next);
        }
    }

    private String generateOrderId() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long counter = orderCounter.incrementAndGet();
        return "AGR-" + datePart + "-" + String.format("%04d", counter % 10000);
    }
}
