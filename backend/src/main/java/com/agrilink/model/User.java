package com.agrilink.model;

import com.agrilink.model.enums.UserRole;
import com.agrilink.model.enums.VerificationStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String fullName;

    private String mobileNumber;

    private String email;

    private String password;

    private LocalDate dateOfBirth;

    private UserRole role;

    private VerificationStatus verificationStatus;

    private String profilePhotoUrl;

    private String googleId;

    private boolean profileCompleted;

    private boolean passwordChangeRequired;

    private String preferredLanguage;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    private boolean active;
}
