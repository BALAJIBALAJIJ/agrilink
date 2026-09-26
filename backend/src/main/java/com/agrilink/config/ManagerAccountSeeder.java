package com.agrilink.config;

import com.agrilink.model.User;
import com.agrilink.model.enums.UserRole;
import com.agrilink.model.enums.VerificationStatus;
import com.agrilink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(3)
public class ManagerAccountSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedManager("DRYUNIT_MANAGER", "Dry Unit Manager", "9000000001", "dryunit123", UserRole.DRY_UNIT_MANAGER);
        seedManager("BIOGAS_MANAGER", "Biogas Plant Manager", "9000000002", "biogas123", UserRole.BIOGAS_MANAGER);
    }

    private void seedManager(String prefix, String name, String mobile, String password, UserRole role) {
        try {
            if (userRepository.findByMobileNumber(mobile).isEmpty()) {
                User manager = User.builder()
                        .fullName(name)
                        .mobileNumber(mobile)
                        .mobile(mobile)
                        .password(passwordEncoder.encode(password))
                        .role(role)
                        .verificationStatus(VerificationStatus.APPROVED)
                        .profileCompleted(true)
                        .passwordChangeRequired(false)
                        .active(true)
                        .preferredLanguage("en")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                userRepository.save(manager);
                log.info("✅ {} account seeded — Mobile: {}, Password: {}", name, mobile, password);
            }
        } catch (Exception e) {
            log.warn("Manager seeder notice for {}: {}", name, e.getMessage());
        }
    }
}
