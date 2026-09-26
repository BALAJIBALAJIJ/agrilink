package com.agrilink.model;

import com.agrilink.model.enums.OrderStatus;
import com.agrilink.model.enums.PaymentStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String orderId; // Human-readable order ID like AGR-20240101-001

    @Indexed
    private String buyerId;
    private String buyerName;

    @Indexed
    private String farmerId;
    private String farmerName;

    private String productId;
    private String productName;
    private String productImageUrl;

    private double quantity; // kg
    private double pricePerKg;
    private double productTotal; // quantity * pricePerKg

    private GeoLocation pickupLocation;
    private GeoLocation deliveryLocation;

    private String transportRequestId;
    private String transporterId;
    private String transporterName;
    private double transportCharge;

    private double totalAmount; // productTotal + transportCharge

    private OrderStatus status;
    private PaymentStatus paymentStatus;

    private String paymentId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime deliveredAt;
}
