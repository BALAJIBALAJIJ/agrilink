package com.agrilink.repository;

import com.agrilink.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByRevieweeId(String revieweeId);
    List<Review> findByOrderId(String orderId);
    boolean existsByOrderIdAndReviewerIdAndRevieweeId(String orderId, String reviewerId, String revieweeId);
}
