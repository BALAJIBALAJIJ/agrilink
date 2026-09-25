package com.agrilink.controller;

import com.agrilink.dto.response.ApiResponse;
import com.agrilink.model.*;
import com.agrilink.repository.*;
import com.agrilink.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final TransporterProfileRepository transporterProfileRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getMyProfile(@AuthenticationPrincipal User user) {
        Object profile = switch (user.getRole()) {
            case FARMER -> farmerProfileRepository.findByUserId(user.getId()).orElse(null);
            case BUYER -> buyerProfileRepository.findByUserId(user.getId()).orElse(null);
            case TRANSPORTER -> transporterProfileRepository.findByUserId(user.getId()).orElse(null);
            default -> null;
        };
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved",
                new Object[]{user, profile}));
    }

    @PostMapping("/photo")
    public ResponseEntity<ApiResponse> uploadPhoto(
            @AuthenticationPrincipal User user,
            @RequestPart("photo") MultipartFile photo) {
        String url = cloudinaryService.uploadImage(photo, "profiles");
        user.setProfilePhotoUrl(url);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded", url));
    }

    @GetMapping("/farmer/{userId}")
    public ResponseEntity<ApiResponse> getFarmerPublicProfile(@PathVariable String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Return only public information
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId).orElse(null);

        return ResponseEntity.ok(ApiResponse.success("Profile retrieved",
                new Object[]{
                        new Object[]{user.getFullName(), user.getProfilePhotoUrl(),
                                user.getVerificationStatus(), user.getRole()},
                        profile
                }));
    }
}
