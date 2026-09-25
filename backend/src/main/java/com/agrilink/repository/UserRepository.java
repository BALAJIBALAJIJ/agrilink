package com.agrilink.repository;

import com.agrilink.model.User;
import com.agrilink.model.enums.UserRole;
import com.agrilink.model.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByMobileNumber(String mobileNumber);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByMobileNumber(String mobileNumber);

    boolean existsByEmail(String email);

    Page<User> findByRole(UserRole role, Pageable pageable);

    Page<User> findByRoleAndVerificationStatus(UserRole role, VerificationStatus status, Pageable pageable);

    List<User> findByVerificationStatus(VerificationStatus status);

    @Query("{'$or': [{'fullName': {$regex: ?0, $options: 'i'}}, {'mobileNumber': {$regex: ?0, $options: 'i'}}, {'email': {$regex: ?0, $options: 'i'}}]}")
    Page<User> searchUsers(String query, Pageable pageable);

    long countByRoleAndVerificationStatus(UserRole role, VerificationStatus status);

    long countByRole(UserRole role);
}
