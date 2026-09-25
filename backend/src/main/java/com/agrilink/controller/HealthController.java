package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final MongoTemplate mongoTemplate;

    @GetMapping("/api/health")
    public ResponseEntity<ApiResponse> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("AGRILINK Backend is running", 
            Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now().toString(),
                "version", "1.0.0"
            )));
    }

    @GetMapping("/api/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/api/fix-indexes")
    public ResponseEntity<ApiResponse> fixIndexes() {
        try {
            // Fix empty strings to null
            long emailFixed = mongoTemplate.updateMulti(
                Query.query(Criteria.where("email").is("")),
                Update.update("email", null), "users"
            ).getModifiedCount();
            long mobileFixed = mongoTemplate.updateMulti(
                Query.query(Criteria.where("mobileNumber").is("")),
                Update.update("mobileNumber", null), "users"
            ).getModifiedCount();

            // Drop ALL non-_id indexes and recreate
            mongoTemplate.getCollection("users").dropIndexes();
            
            // Recreate as sparse unique
            mongoTemplate.indexOps("users").ensureIndex(
                new Index().on("email", org.springframework.data.domain.Sort.Direction.ASC).unique().sparse()
            );
            mongoTemplate.indexOps("users").ensureIndex(
                new Index().on("mobileNumber", org.springframework.data.domain.Sort.Direction.ASC).unique().sparse()
            );

            return ResponseEntity.ok(ApiResponse.success("Indexes fixed", 
                Map.of("emailsFixed", emailFixed, "mobilesFixed", mobileFixed)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Fix failed: " + e.getMessage()));
        }
    }
}
