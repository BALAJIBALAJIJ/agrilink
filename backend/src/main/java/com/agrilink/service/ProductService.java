package com.agrilink.service;

import com.agrilink.dto.request.ProductRequest;
import com.agrilink.exception.*;
import com.agrilink.model.*;
import com.agrilink.model.enums.OrderStatus;
import com.agrilink.model.enums.VerificationStatus;
import com.agrilink.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final OrderRepository orderRepository;

    public Product createProduct(String farmerId, ProductRequest request, String imageUrl) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));

        if (farmer.getVerificationStatus() != VerificationStatus.APPROVED) {
            throw new ForbiddenException("Account must be verified to create listings");
        }

        FarmerProfile profile = farmerProfileRepository.findByUserId(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer profile not found"));

        Product product = Product.builder()
                .farmerId(farmerId)
                .farmerName(farmer.getFullName())
                .farmerProfilePhotoUrl(farmer.getProfilePhotoUrl())
                .category(request.getCategory())
                .vegetableName(request.getVegetableName())
                .vegetableNameTamil(request.getVegetableNameTamil())
                .imageUrl(imageUrl)
                .quantityAvailable(request.getQuantityAvailable())
                .pricePerKg(request.getPricePerKg())
                .minimumSaleQuantity(request.getMinimumSaleQuantity())
                .harvestDate(request.getHarvestDate() != null ? LocalDate.parse(request.getHarvestDate()) : null)
                .description(request.getDescription())
                .farmLocation(profile.getFarmLocation())
                .available(true)
                .paused(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        product = productRepository.save(product);

        // Update farmer stats
        profile.setTotalListings(profile.getTotalListings() + 1);
        profile.setActiveListings(profile.getActiveListings() + 1);
        farmerProfileRepository.save(profile);

        return product;
    }

    public Page<Product> getActiveProducts(Pageable pageable) {
        return productRepository.findByAvailableTrueAndPausedFalse(pageable);
    }

    public Page<Product> searchProducts(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return getActiveProducts(pageable);
        }
        return productRepository.searchProducts(query, pageable);
    }

    public Product getProduct(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    public List<Product> getFarmerProducts(String farmerId) {
        return productRepository.findByFarmerId(farmerId);
    }

    public Product updateProduct(String farmerId, String productId, ProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("Not authorized to update this product");
        }

        if (request.getQuantityAvailable() > 0) product.setQuantityAvailable(request.getQuantityAvailable());
        if (request.getPricePerKg() > 0) product.setPricePerKg(request.getPricePerKg());
        if (request.getMinimumSaleQuantity() > 0) product.setMinimumSaleQuantity(request.getMinimumSaleQuantity());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    public Product togglePause(String farmerId, String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("Not authorized");
        }

        product.setPaused(!product.isPaused());
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public void removeProduct(String farmerId, String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("Not authorized");
        }

        // Check for active orders
        List<OrderStatus> terminalStatuses = Arrays.asList(
                OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.FARMER_REJECTED);
        if (orderRepository.existsByProductIdAndStatusNotIn(productId, terminalStatuses)) {
            throw new BadRequestException("Cannot remove product with active orders");
        }

        product.setAvailable(false);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        // Update farmer stats
        farmerProfileRepository.findByUserId(farmerId).ifPresent(profile -> {
            profile.setActiveListings(Math.max(0, profile.getActiveListings() - 1));
            farmerProfileRepository.save(profile);
        });
    }
}
