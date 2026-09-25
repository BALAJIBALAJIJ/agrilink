package com.agrilink.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndex(name = "unique_review", def = "{'orderId': 1, 'reviewerId': 1, 'revieweeId': 1}", unique = true)
public class Review {

    @Id
    private String id;

    @Indexed
    private String orderId;

    @Indexed
    private String reviewerId;
    private String reviewerName;
    private String reviewerRole;

    @Indexed
    private String revieweeId;
    private String revieweeName;
    private String revieweeRole;

    private int rating; // 1-5
    private String comment;

    @CreatedDate
    private LocalDateTime createdAt;
}
