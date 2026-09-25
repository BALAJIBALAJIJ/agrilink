package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.VegetableCatalog;
import com.agrilink.repository.VegetableCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final VegetableCatalogRepository catalogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse> getAllVegetables() {
        return ResponseEntity.ok(ApiResponse.success("Catalog", catalogRepository.findAll()));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.success("Category vegetables",
                catalogRepository.findByCategory(category)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse> search(@RequestParam String q) {
        List<VegetableCatalog> results = catalogRepository.searchByName(q);
        return ResponseEntity.ok(ApiResponse.success("Search results", results));
    }
}
