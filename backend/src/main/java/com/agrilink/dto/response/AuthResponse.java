package com.agrilink.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String userId;
    private String fullName;
    private String role;
    private String verificationStatus;
    private boolean profileCompleted;
    private boolean passwordChangeRequired;
}
