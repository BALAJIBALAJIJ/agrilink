package com.agrilink.service;

import com.agrilink.exception.*;
import com.agrilink.model.*;
import com.agrilink.model.enums.*;
import com.agrilink.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final DryUnitRepository dryUnitRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    public User approveUser(String adminId, String userId, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setVerificationStatus(VerificationStatus.APPROVED);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        createAuditLog(adminId, "APPROVE_USER", "USER", userId, "Approved: " + notes);

        notificationService.createNotification(userId, "Account Approved",
                "Your account has been verified and approved. Welcome to AGRILINK!",
                "VERIFICATION", userId, "USER");

        return user;
    }

    public User rejectUser(String adminId, String userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setVerificationStatus(VerificationStatus.REJECTED);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        createAuditLog(adminId, "REJECT_USER", "USER", userId, "Rejected: " + reason);

        notificationService.createNotification(userId, "Account Rejected",
                "Your account verification was not approved. Reason: " + reason,
                "VERIFICATION", userId, "USER");

        return user;
    }

    public User suspendUser(String adminId, String userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setVerificationStatus(VerificationStatus.SUSPENDED);
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        createAuditLog(adminId, "SUSPEND_USER", "USER", userId, "Suspended: " + reason);

        return user;
    }

    public User requestChanges(String adminId, String userId, String details) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setVerificationStatus(VerificationStatus.CHANGES_REQUESTED);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        createAuditLog(adminId, "REQUEST_CHANGES", "USER", userId, details);

        notificationService.createNotification(userId, "Profile Changes Requested",
                "Admin has requested changes: " + details,
                "VERIFICATION", userId, "USER");

        return user;
    }

    public Page<User> getPendingUsers(Pageable pageable) {
        return userRepository.findByRoleAndVerificationStatus(null, VerificationStatus.PENDING_VERIFICATION, pageable);
    }

    public Page<User> getUsersByRoleAndStatus(UserRole role, VerificationStatus status, Pageable pageable) {
        if (role != null && status != null) {
            return userRepository.findByRoleAndVerificationStatus(role, status, pageable);
        } else if (role != null) {
            return userRepository.findByRole(role, pageable);
        }
        return userRepository.findAll(pageable);
    }

    public Page<User> searchUsers(String query, Pageable pageable) {
        return userRepository.searchUsers(query, pageable);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("pendingFarmers", userRepository.countByRoleAndVerificationStatus(UserRole.FARMER, VerificationStatus.PENDING_VERIFICATION));
        stats.put("pendingBuyers", userRepository.countByRoleAndVerificationStatus(UserRole.BUYER, VerificationStatus.PENDING_VERIFICATION));
        stats.put("pendingTransporters", userRepository.countByRoleAndVerificationStatus(UserRole.TRANSPORTER, VerificationStatus.PENDING_VERIFICATION));
        stats.put("totalFarmers", userRepository.countByRole(UserRole.FARMER));
        stats.put("totalBuyers", userRepository.countByRole(UserRole.BUYER));
        stats.put("totalTransporters", userRepository.countByRole(UserRole.TRANSPORTER));
        stats.put("totalOrders", orderRepository.count());
        stats.put("activeOrders", orderRepository.countByStatus(OrderStatus.IN_TRANSIT));
        stats.put("completedOrders", orderRepository.countByStatus(OrderStatus.COMPLETED));

        return stats;
    }

    public DryUnit createDryUnit(String adminId, DryUnit dryUnit) {
        dryUnit.setActive(true);
        dryUnit.setCreatedAt(LocalDateTime.now());
        dryUnit.setUpdatedAt(LocalDateTime.now());
        DryUnit saved = dryUnitRepository.save(dryUnit);

        createAuditLog(adminId, "CREATE_DRY_UNIT", "DRY_UNIT", saved.getId(), "Created dry unit: " + saved.getName());

        return saved;
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    private void createAuditLog(String adminId, String action, String targetType, String targetId, String details) {
        User admin = userRepository.findById(adminId).orElse(null);
        AuditLog log = AuditLog.builder()
                .adminId(adminId)
                .adminName(admin != null ? admin.getFullName() : "System")
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    public void deleteUser(String adminId, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Cannot delete admin user");
        }
        userRepository.delete(user);
        createAuditLog(adminId, "DELETE_USER", "USER", userId, "Deleted user: " + user.getFullName());
    }

    public int clearAllNonAdminUsers(String adminId) {
        List<User> nonAdmins = userRepository.findAll().stream()
                .filter(u -> u.getRole() != UserRole.ADMIN)
                .toList();
        int count = nonAdmins.size();
        userRepository.deleteAll(nonAdmins);
        createAuditLog(adminId, "CLEAR_ALL_USERS", "SYSTEM", "", "Cleared " + count + " non-admin users");
        return count;
    }
}
