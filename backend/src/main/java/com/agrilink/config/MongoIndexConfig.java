package com.agrilink.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class MongoIndexConfig {

    @Bean
    @org.springframework.core.annotation.Order(1)
    CommandLineRunner fixMongoIndexes(MongoTemplate mongoTemplate) {
        return args -> {
            try {
                // Fix empty strings to null for email and mobile
                mongoTemplate.updateMulti(
                    Query.query(Criteria.where("email").is("")),
                    Update.update("email", null),
                    "users"
                );
                mongoTemplate.updateMulti(
                    Query.query(Criteria.where("mobileNumber").is("")),
                    Update.update("mobileNumber", null),
                    "users"
                );

                try {
                    mongoTemplate.getCollection("users").dropIndex("email_1");
                    log.info("Dropped old email index");
                } catch (Exception e) { /* index may not exist */ }
                try {
                    mongoTemplate.getCollection("users").dropIndex("mobileNumber_1");
                    log.info("Dropped old mobileNumber index");
                } catch (Exception e) { /* index may not exist */ }
                try {
                    mongoTemplate.getCollection("users").dropIndex("mobile_1");
                    log.info("Dropped old mobile index");
                } catch (Exception e) { /* index may not exist */ }

                // Recreate as sparse unique
                mongoTemplate.indexOps("users").ensureIndex(
                    new Index().on("email", org.springframework.data.domain.Sort.Direction.ASC)
                        .unique().sparse()
                );
                mongoTemplate.indexOps("users").ensureIndex(
                    new Index().on("mobileNumber", org.springframework.data.domain.Sort.Direction.ASC)
                        .unique().sparse()
                );

                log.info("MongoDB indexes fixed successfully");
            } catch (Exception e) {
                log.warn("Index fix warning: {}", e.getMessage());
            }
        };
    }
}
