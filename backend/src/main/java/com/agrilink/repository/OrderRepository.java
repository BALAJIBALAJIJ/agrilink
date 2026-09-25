package com.agrilink.repository;

import com.agrilink.model.Order;
import com.agrilink.model.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    Optional<Order> findByOrderId(String orderId);
    Page<Order> findByBuyerId(String buyerId, Pageable pageable);
    Page<Order> findByFarmerId(String farmerId, Pageable pageable);
    List<Order> findByFarmerIdAndStatus(String farmerId, OrderStatus status);
    List<Order> findByBuyerIdAndStatus(String buyerId, OrderStatus status);
    List<Order> findByTransporterId(String transporterId);
    long countByFarmerIdAndStatus(String farmerId, OrderStatus status);
    long countByBuyerIdAndStatus(String buyerId, OrderStatus status);
    long countByFarmerId(String farmerId);
    long countByBuyerId(String buyerId);
    long countByStatus(OrderStatus status);
    boolean existsByProductIdAndStatusNotIn(String productId, List<OrderStatus> statuses);
}
