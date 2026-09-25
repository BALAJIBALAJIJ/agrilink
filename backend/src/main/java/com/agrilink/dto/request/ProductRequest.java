package com.agrilink.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ProductRequest {

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Vegetable name is required")
    private String vegetableName;

    private String vegetableNameTamil;

    @Positive(message = "Quantity must be positive")
    private double quantityAvailable;

    @Positive(message = "Price must be positive")
    private double pricePerKg;

    @Min(value = 1, message = "Minimum sale quantity must be at least 1")
    private double minimumSaleQuantity;

    private String harvestDate;
    private String description;
}
