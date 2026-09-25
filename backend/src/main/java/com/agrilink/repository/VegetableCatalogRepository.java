package com.agrilink.repository;

import com.agrilink.model.VegetableCatalog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface VegetableCatalogRepository extends MongoRepository<VegetableCatalog, String> {
    List<VegetableCatalog> findByCategory(String category);

    @Query("{'$or': [{'name': {$regex: ?0, $options: 'i'}}, {'nameTamil': {$regex: ?0, $options: 'i'}}, {'aliases': {$regex: ?0, $options: 'i'}}]}")
    List<VegetableCatalog> searchByName(String query);

    List<String> findDistinctCategoryBy();
}
