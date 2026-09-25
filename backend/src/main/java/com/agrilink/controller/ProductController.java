package com.agrilink.controller;

import com.agrilink.dto.request.ProductRequest;
import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.Product;
import com.agrilink.model.User;
import com.agrilink.service.CloudinaryService;
import com.agrilink.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    public ResponseEntity<ApiResponse> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        Page<Product> products;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (search != null && !search.isBlank()) {
            products = productService.searchProducts(search, pageRequest);
        } else if (category != null && !category.isBlank()) {
            products = productService.searchProducts(category, pageRequest);
        } else {
            products = productService.getActiveProducts(pageRequest);
        }

        return ResponseEntity.ok(ApiResponse.success("Products retrieved", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getProduct(@PathVariable String id) {
        Product product = productService.getProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product retrieved", product));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createProduct(
            @AuthenticationPrincipal User user,
            @Valid @RequestPart("product") ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = cloudinaryService.uploadImage(image, "products");
        }
        Product product = productService.createProduct(user.getId(), request, imageUrl);
        return ResponseEntity.ok(ApiResponse.success("Product listed successfully", product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateProduct(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @Valid @RequestBody ProductRequest request) {
        Product product = productService.updateProduct(user.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated", product));
    }

    @PutMapping("/{id}/toggle-pause")
    public ResponseEntity<ApiResponse> togglePause(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Product product = productService.togglePause(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Product " + (product.isPaused() ? "paused" : "resumed"), product));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> removeProduct(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        productService.removeProduct(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Product removed"));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<ApiResponse> getFarmerProducts(@PathVariable String farmerId) {
        List<Product> products = productService.getFarmerProducts(farmerId);
        return ResponseEntity.ok(ApiResponse.success("Farmer products retrieved", products));
    }
}
