package com.agrilink.dto.request;

import com.agrilink.model.GeoLocation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class OrderRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @Positive(message = "Quantity must be positive")
    private double quantity;

    @NotNull(message = "Delivery location is required")
    private GeoLocation deliveryLocation;
}
