package com.agrilink.repository;

import com.agrilink.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    Page<Product> findByAvailableTrueAndPausedFalse(Pageable pageable);
    List<Product> findByFarmerIdAndAvailableTrue(String farmerId);
    List<Product> findByFarmerId(String farmerId);
    long countByFarmerIdAndAvailableTrue(String farmerId);
    long countByFarmerId(String farmerId);

    @Query("{'$and': [{'available': true}, {'paused': false}, {'$or': [{'vegetableName': {$regex: ?0, $options: 'i'}}, {'vegetableNameTamil': {$regex: ?0, $options: 'i'}}, {'category': {$regex: ?0, $options: 'i'}}, {'farmerName': {$regex: ?0, $options: 'i'}}]}]}")
    Page<Product> searchProducts(String query, Pageable pageable);

    Page<Product> findByCategoryAndAvailableTrueAndPausedFalse(String category, Pageable pageable);
}
