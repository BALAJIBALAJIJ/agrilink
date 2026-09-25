package com.agrilink.controller;

import com.agrilink.dto.request.OrderRequest;
import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.Order;
import com.agrilink.model.User;
import com.agrilink.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse> createOrder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody OrderRequest request) {
        Order order = orderService.createOrder(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Order placed successfully", order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getOrder(@PathVariable String id) {
        Order order = orderService.getOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved", order));
    }

    @GetMapping("/farmer")
    public ResponseEntity<ApiResponse> getFarmerOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Order> orders = orderService.getFarmerOrders(user.getId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved", orders));
    }

    @GetMapping("/buyer")
    public ResponseEntity<ApiResponse> getBuyerOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Order> orders = orderService.getBuyerOrders(user.getId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved", orders));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ApiResponse> acceptOrder(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Order order = orderService.acceptOrder(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Order accepted", order));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse> rejectOrder(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Order order = orderService.rejectOrder(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Order rejected", order));
    }
}
