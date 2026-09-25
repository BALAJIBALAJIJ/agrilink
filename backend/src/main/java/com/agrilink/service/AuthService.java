package com.agrilink.service;

import com.agrilink.dto.request.*;
import com.agrilink.dto.response.AuthResponse;
import com.agrilink.exception.*;
import com.agrilink.model.*;
import com.agrilink.model.enums.UserRole;
import com.agrilink.model.enums.VerificationStatus;
import com.agrilink.repository.*;
import com.agrilink.security.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final TransporterProfileRepository transporterProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final NotificationService notificationService;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    public AuthResponse register(RegisterRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Normalize mobile number
        String normalizedMobile = normalizeMobile(request.getMobileNumber());

        // Check for duplicate mobile number
        if (userRepository.existsByMobileNumber(normalizedMobile)) {
            throw new ConflictException("Mobile number already registered");
        }

        // Check for duplicate email
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        UserRole role = UserRole.valueOf(request.getRole().toUpperCase());

        User user = User.builder()
                .fullName(request.getFullName())
                .mobileNumber(normalizedMobile)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .dateOfBirth(request.getDateOfBirth() != null ? LocalDate.parse(request.getDateOfBirth()) : null)
                .role(role)
                .verificationStatus(VerificationStatus.APPROVED)
                .profileCompleted(false)
                .passwordChangeRequired(false)
                .preferredLanguage("en")
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        // Create role-specific profile
        createRoleProfile(user);

        String token = tokenProvider.generateToken(user.getId(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .verificationStatus(user.getVerificationStatus().name())
                .profileCompleted(user.isProfileCompleted())
                .passwordChangeRequired(user.isPasswordChangeRequired())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedMobile = normalizeMobile(request.getMobileNumber());

        User user = userRepository.findByMobileNumber(normalizedMobile)
                .orElseThrow(() -> new UnauthorizedException("Invalid mobile number or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid mobile number or password");
        }

        if (!user.isActive()) {
            throw new ForbiddenException("Account is suspended. Contact admin.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .verificationStatus(user.getVerificationStatus().name())
                .profileCompleted(user.isProfileCompleted())
                .passwordChangeRequired(user.isPasswordChangeRequired())
                .build();
    }

    public AuthResponse adminLogin(LoginRequest request) {
        // Admin login uses username (mobile number field) and password
        if (!request.getMobileNumber().equals(adminUsername)) {
            throw new UnauthorizedException("Invalid admin credentials");
        }

        User admin = userRepository.findByMobileNumber("ADMIN_" + adminUsername)
                .orElseGet(() -> {
                    // Seed admin on first login
                    if (adminPassword == null || adminPassword.isBlank()) {
                        throw new BadRequestException("Admin password not configured");
                    }
                    User newAdmin = User.builder()
                            .fullName("System Admin")
                            .mobileNumber("ADMIN_" + adminUsername)
                            .password(passwordEncoder.encode(adminPassword))
                            .role(UserRole.ADMIN)
                            .verificationStatus(VerificationStatus.APPROVED)
                            .profileCompleted(true)
                            .passwordChangeRequired(true)
                            .active(true)
                            .preferredLanguage("en")
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return userRepository.save(newAdmin);
                });

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new UnauthorizedException("Invalid admin credentials");
        }

        String token = tokenProvider.generateToken(admin.getId(), admin.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(admin.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(admin.getId())
                .fullName(admin.getFullName())
                .role(admin.getRole().name())
                .verificationStatus(admin.getVerificationStatus().name())
                .profileCompleted(admin.isProfileCompleted())
                .passwordChangeRequired(admin.isPasswordChangeRequired())
                .build();
    }

    public AuthResponse googleAuth(GoogleAuthRequest request, String role) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getCredential());
            if (idToken == null) {
                throw new UnauthorizedException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            // Check if user already exists with this Google ID
            User user = userRepository.findByGoogleId(googleId).orElse(null);

            if (user != null) {
                // Existing user - login
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
            } else {
                // Check if email already exists
                if (email != null && userRepository.existsByEmail(email)) {
                    throw new ConflictException("Email already registered. Please login with mobile number.");
                }

                // New user - create with pending profile
                UserRole userRole = role != null ? UserRole.valueOf(role.toUpperCase()) : UserRole.FARMER;
                user = User.builder()
                        .fullName(name)
                        .email(email)
                        .googleId(googleId)
                        .profilePhotoUrl(pictureUrl)
                        .role(userRole)
                        .verificationStatus(VerificationStatus.PENDING_VERIFICATION)
                        .profileCompleted(false)
                        .passwordChangeRequired(false)
                        .preferredLanguage("en")
                        .active(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                user = userRepository.save(user);
            }

            String token = tokenProvider.generateToken(user.getId(), user.getRole().name());
            String refreshToken = tokenProvider.generateRefreshToken(user.getId());

            return AuthResponse.builder()
                    .token(token)
                    .refreshToken(refreshToken)
                    .userId(user.getId())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .verificationStatus(user.getVerificationStatus().name())
                    .profileCompleted(user.isProfileCompleted())
                    .passwordChangeRequired(user.isPasswordChangeRequired())
                    .build();

        } catch (UnauthorizedException | ConflictException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google auth error", e);
            throw new UnauthorizedException("Google authentication failed");
        }
    }

    public AuthResponse completeProfile(String userId, ProfileCompleteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            try {
                user.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
            } catch (Exception e) {
                try {
                    user.setDateOfBirth(LocalDate.parse(request.getDateOfBirth(), 
                        java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy")));
                } catch (Exception e2) {
                    // Skip if date can't be parsed
                }
            }
        }
        if (request.getMobileNumber() != null && !request.getMobileNumber().isBlank()) {
            String normalized = normalizeMobile(request.getMobileNumber());
            if (!normalized.isBlank() && (user.getMobileNumber() == null || !user.getMobileNumber().equals(normalized))) {
                if (userRepository.existsByMobileNumber(normalized)) {
                    throw new ConflictException("Mobile number already registered");
                }
                user.setMobileNumber(normalized);
            }
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }

        user.setProfileCompleted(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Create/update role-specific profile
        createOrUpdateRoleProfile(user, request);

        notificationService.createNotification(userId, "Profile Completed",
                "Your profile has been submitted for verification.", "SYSTEM", null, null);

        String token = tokenProvider.generateToken(user.getId(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .verificationStatus(user.getVerificationStatus().name())
                .profileCompleted(true)
                .passwordChangeRequired(user.isPasswordChangeRequired())
                .build();
    }

    private void createRoleProfile(User user) {
        switch (user.getRole()) {
            case FARMER -> {
                FarmerProfile profile = FarmerProfile.builder()
                        .userId(user.getId())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                farmerProfileRepository.save(profile);
            }
            case BUYER -> {
                BuyerProfile profile = BuyerProfile.builder()
                        .userId(user.getId())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                buyerProfileRepository.save(profile);
            }
            case TRANSPORTER -> {
                TransporterProfile profile = TransporterProfile.builder()
                        .userId(user.getId())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                transporterProfileRepository.save(profile);
            }
            default -> {} // Other roles handled separately
        }
    }

    private void createOrUpdateRoleProfile(User user, ProfileCompleteRequest request) {
        switch (user.getRole()) {
            case FARMER -> {
                FarmerProfile profile = farmerProfileRepository.findByUserId(user.getId())
                        .orElse(FarmerProfile.builder().userId(user.getId()).build());
                if (request.getLocation() != null) {
                    profile.setFarmLocation(request.getLocation());
                }
                profile.setUpdatedAt(LocalDateTime.now());
                farmerProfileRepository.save(profile);
            }
            case BUYER -> {
                BuyerProfile profile = buyerProfileRepository.findByUserId(user.getId())
                        .orElse(BuyerProfile.builder().userId(user.getId()).build());
                if (request.getLocation() != null) {
                    profile.setLocation(request.getLocation());
                }
                profile.setUpdatedAt(LocalDateTime.now());
                buyerProfileRepository.save(profile);
            }
            case TRANSPORTER -> {
                TransporterProfile profile = transporterProfileRepository.findByUserId(user.getId())
                        .orElse(TransporterProfile.builder().userId(user.getId()).build());
                if (request.getVehicleType() != null) profile.setVehicleType(request.getVehicleType());
                if (request.getVehicleNumber() != null) profile.setVehicleNumber(request.getVehicleNumber());
                if (request.getVehicleModel() != null) profile.setVehicleModel(request.getVehicleModel());
                if (request.getVehicleCapacity() > 0) profile.setVehicleCapacity(request.getVehicleCapacity());
                if (request.getFuelType() != null) profile.setFuelType(request.getFuelType());
                profile.setRefrigerated(request.isRefrigerated());
                if (request.getVehicleMileage() > 0) profile.setVehicleMileage(request.getVehicleMileage());
                if (request.getServiceArea() != null) profile.setServiceArea(request.getServiceArea());
                if (request.getWorkingHours() != null) profile.setWorkingHours(request.getWorkingHours());
                if (request.getBaseCharge() > 0) profile.setBaseCharge(request.getBaseCharge());
                if (request.getPerKmCharge() > 0) profile.setPerKmCharge(request.getPerKmCharge());
                profile.setLoadingCharge(request.getLoadingCharge());
                profile.setUnloadingCharge(request.getUnloadingCharge());
                if (request.getLocation() != null) profile.setCurrentLocation(request.getLocation());
                profile.setUpdatedAt(LocalDateTime.now());
                transporterProfileRepository.save(profile);
            }
            default -> {}
        }
    }

    private String normalizeMobile(String mobile) {
        if (mobile == null) return null;
        String normalized = mobile.replaceAll("[^0-9]", "");
        if (normalized.startsWith("91") && normalized.length() == 12) {
            normalized = normalized.substring(2);
        }
        return normalized;
    }
}
