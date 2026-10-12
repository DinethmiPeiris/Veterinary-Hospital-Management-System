package com.vhms.vhms.service;

import com.vhms.vhms.dto.AuthResponse;
import com.vhms.vhms.dto.LoginRequest;
import com.vhms.vhms.dto.RegisterRequest;
import com.vhms.vhms.model.Doctor;
import com.vhms.vhms.model.User;
import com.vhms.vhms.repository.DoctorRepository;
import com.vhms.vhms.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.time.Instant;
import java.security.SecureRandom;
import com.vhms.vhms.dto.ForgotPasswordRequest;
import com.vhms.vhms.dto.ResetPasswordRequest;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private EmailService emailService;

    @PostConstruct
    public void initDefaultAdmin() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@vhms.com");
        if (adminOpt.isEmpty()) {
            User admin = new User(
                    "System Admin",
                    "admin@vhms.com",
                    "0771234567",
                    "Colombo 07, Sri Lanka",
                    "Admin@VHMS$2026!",
                    "ADMIN",
                    "ACTIVE");
            admin.setId("SJAH-ADMIN-001");
            userRepository.save(admin);
            System.out.println("✅ Default Admin account seeded: admin@vhms.com / admin123");
        } else {
            User admin = adminOpt.get();
            admin.setPassword("Admin@VHMS$2026!");
            admin.setRole("ADMIN");
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
            System.out.println("✅ Default Admin account refreshed: admin@vhms.com / Admin@VHMS$2026!");
        }

        // Auto-sync all existing Doctor users from 'users' collection to 'doctors'
        // collection
        try {
            List<User> doctorUsers = userRepository.findByRole("DOCTOR");
            if (doctorUsers != null) {
                int count = 1;
                for (User u : doctorUsers) {
                    if (u.getEmail() != null && !doctorRepository.existsByEmail(u.getEmail())) {
                        String staffId;
                        do {
                            staffId = "SJAH-DOC-" + String.format("%03d", count++);
                        } while (doctorRepository.existsByStaffIdIgnoreCase(staffId));
                        
                        Doctor doc = new Doctor(
                                staffId,
                                u.getName(),
                                u.getEmail(),
                                u.getPhone() != null ? u.getPhone() : "0771234567",
                                u.getPassword(),
                                u.getAddress() != null && !u.getAddress().isEmpty() ? u.getAddress()
                                        : "Veterinary Surgery & Medicine");
                        doctorRepository.save(doc);
                        System.out.println("✅ Synced doctor to doctors collection: " + u.getName());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Note on doctor sync: " + e.getMessage());
        }

        // Ensure all existing doctors in 'doctors' collection have working schedules &
        // slots populated in MongoDB
        try {
            List<Doctor> allDocs = doctorRepository.findAll();
            for (Doctor doc : allDocs) {
                boolean needsSave = false;
                if (doc.getAvailableHours() == null || doc.getAvailableHours().isEmpty()) {
                    doc.setAvailableHours("Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM");
                    needsSave = true;
                }
                if (doc.getWorkingDays() == null || doc.getWorkingDays().isEmpty()) {
                    doc.setWorkingDays("Mon - Sun");
                    needsSave = true;
                }
                if (doc.getAvailableSlots() == null || doc.getAvailableSlots().isEmpty()) {
                    doc.setAvailableSlots(java.util.Arrays.asList("11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
                            "01:00 PM", "01:30 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"));
                    needsSave = true;
                }
                if (doc.getAvailableServices() == null || doc.getAvailableServices().isEmpty()) {
                    doc.setAvailableServices(java.util.Arrays.asList("OPD Consultation", "Surgery & Trauma",
                            "Vaccination", "Emergency Care"));
                    needsSave = true;
                }
                if (needsSave) {
                    doctorRepository.save(doc);
                    System.out.println("✅ Populated working schedule for doctor in MongoDB: " + doc.getFullName());
                }
            }
        } catch (Exception e) {
            System.err.println("Note on doctor schedule repair: " + e.getMessage());
        }
    }

    public AuthResponse registerPetOwner(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(false, "Email address is already registered!");
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress(),
                request.getPassword(),
                "PET_OWNER",
                "PENDING_APPROVAL");

        User savedUser = userRepository.save(user);

        return new AuthResponse(
                true,
                "Registration submitted successfully! Your account is pending hospital administrator approval.",
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getStatus());
    }

    public AuthResponse createDoctorAccount(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(false, "Email address is already registered!");
        }

        String rawPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty())
                ? request.getPassword()
                : "Doctor@123";

        User doctorUser = new User(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress() != null && !request.getAddress().isEmpty() ? request.getAddress()
                        : "Hospital Staff",
                rawPassword,
                "DOCTOR",
                "ACTIVE");

        User savedDoctor = userRepository.save(doctorUser);

        // Also save to dedicated 'doctors' collection in MongoDB
        try {
            String staffId = "SJAH-DOC-" + String.format("%03d", System.currentTimeMillis() % 1000);
            Doctor docEntity = new Doctor(
                    staffId,
                    request.getName(),
                    request.getEmail(),
                    request.getPhone(),
                    rawPassword,
                    request.getAddress() != null && !request.getAddress().isEmpty() ? request.getAddress()
                            : "Veterinary Surgery");
            doctorRepository.save(docEntity);
        } catch (Exception e) {
            System.err.println("Note: Could not sync to doctors collection: " + e.getMessage());
        }

        return new AuthResponse(
                true,
                "Doctor account for " + savedDoctor.getName() + " created successfully!",
                savedDoctor.getId(),
                savedDoctor.getName(),
                savedDoctor.getEmail(),
                savedDoctor.getRole(),
                savedDoctor.getStatus());
    }

    public AuthResponse login(LoginRequest request) {
        if (request == null || request.getIdentifier() == null || request.getPassword() == null) {
            return new AuthResponse(false, "Please provide both account ID/email and password.");
        }

        String identifier = request.getIdentifier().trim();
        String rawPassword = request.getPassword().trim();

        // 1. Try finding by email (case insensitive)
        Optional<User> userOpt = userRepository.findByEmail(identifier.toLowerCase());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(identifier);
        }
        // 2. Try finding by ID (e.g. SJAH-ADMIN-001)
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findById(identifier);
        }

        // Default Admin Fallback / Auto-repair
        if (userOpt.isEmpty()
                && ("admin@vhms.com".equalsIgnoreCase(identifier) || "SJAH-ADMIN-001".equalsIgnoreCase(identifier))) {
            User admin = new User("System Admin", "admin@vhms.com", "0771234567", "Colombo 07",
                    "Admin@VHMS$2026!", "ADMIN", "ACTIVE");
            admin.setId("SJAH-ADMIN-001");
            userOpt = Optional.of(userRepository.save(admin));
        }

        if (userOpt.isEmpty()) {
            return new AuthResponse(false, "Invalid credentials or account ID!");
        }

        User user = userOpt.get();

        // Password matching check (plaintext or BCrypt)
        boolean passwordMatches = rawPassword.equals(user.getPassword());
        if (!passwordMatches && user.getPassword() != null && user.getPassword().startsWith("$2a$")) {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            passwordMatches = encoder.matches(rawPassword, user.getPassword());
        }

        // Special case for default admin
        if (!passwordMatches && "admin@vhms.com".equalsIgnoreCase(user.getEmail()) && "Admin@VHMS$2026!".equals(rawPassword)) {
            user.setPassword("Admin@VHMS$2026!");
            userRepository.save(user);
            passwordMatches = true;
        }

        if (!passwordMatches) {
            return new AuthResponse(false, "Invalid password. Please double check your credentials.");
        }

        if ("PENDING_APPROVAL".equalsIgnoreCase(user.getStatus())) {
            return new AuthResponse(false,
                    "Your account registration is pending approval by the hospital administrator.");
        }

        if ("REJECTED".equalsIgnoreCase(user.getStatus())) {
            return new AuthResponse(false, "Your account registration was rejected by the hospital administrator.");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            return new AuthResponse(false, "Your account is currently inactive.");
        }

        // Fix for inconsistent roles: check if they exist in doctor collection
        if (!"DOCTOR".equalsIgnoreCase(user.getRole())) {
            if (user.getEmail() != null && doctorRepository.existsByEmailIgnoreCase(user.getEmail())) {
                user.setRole("DOCTOR");
                userRepository.save(user); // auto-repair
                System.out.println("✅ Repaired underlying authentication inconsistency: Set role to DOCTOR for "
                        + user.getEmail());
            } else if (user.getId() != null && doctorRepository.existsByStaffIdIgnoreCase(user.getId())) {
                user.setRole("DOCTOR");
                userRepository.save(user); // auto-repair
                System.out.println(
                        "✅ Repaired underlying authentication inconsistency: Set role to DOCTOR for " + user.getId());
            }
        }

        return new AuthResponse(
                true,
                "Authentication successful!",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus());
    }

    public List<User> getPendingUsers() {
        return userRepository.findByStatus("PENDING_APPROVAL");
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public AuthResponse approveUser(String id) {
        Optional<User> userOpt = findUserForAdminAction(id);
        if (userOpt.isEmpty()) {
            return new AuthResponse(false, "User not found!");
        }

        User user = userOpt.get();
        user.setStatus("ACTIVE");
        userRepository.save(user);

        return new AuthResponse(
                true,
                "User " + user.getName() + " has been approved successfully!",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus());
    }

    public AuthResponse rejectUser(String id) {
        Optional<User> userOpt = findUserForAdminAction(id);
        if (userOpt.isEmpty()) {
            return new AuthResponse(false, "User not found!");
        }

        User user = userOpt.get();
        user.setStatus("REJECTED");
        userRepository.save(user);

        return new AuthResponse(
                true,
                "User " + user.getName() + " has been rejected!",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus());
    }

    /** Resolve by Mongo id, or by email when a stale local PO-* id is sent. */
    private Optional<User> findUserForAdminAction(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        Optional<User> byId = userRepository.findById(id);
        if (byId.isPresent()) {
            return byId;
        }
        if (id.contains("@")) {
            Optional<User> byEmail = userRepository.findByEmail(id.toLowerCase());
            if (byEmail.isPresent()) {
                return byEmail;
            }
            return userRepository.findByEmail(id);
        }
        return Optional.empty();
    }

    public AuthResponse deleteUser(String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return new AuthResponse(false, "User not found!");
        }

        User user = userOpt.get();
        userRepository.deleteById(id);

        return new AuthResponse(true, "User " + user.getName() + " has been permanently deleted!");
    }

    public AuthResponse toggleUserStatus(String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return new AuthResponse(false, "User not found!");
        }

        User user = userOpt.get();
        if ("ACTIVE".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("INACTIVE");
        } else {
            user.setStatus("ACTIVE");
        }
        userRepository.save(user);

        if ("DOCTOR".equalsIgnoreCase(user.getRole()) || "ON_DUTY".equalsIgnoreCase(user.getStatus())) {
            if (user.getEmail() != null) {
                doctorRepository.findFirstByEmailIgnoreCase(user.getEmail()).ifPresent(doc -> {
                    doc.setActive("ACTIVE".equalsIgnoreCase(user.getStatus()));
                    doctorRepository.save(doc);
                });
            }
            if (user.getId() != null) {
                doctorRepository.findFirstByStaffIdIgnoreCase(user.getId()).ifPresent(doc -> {
                    doc.setActive("ACTIVE".equalsIgnoreCase(user.getStatus()));
                    doctorRepository.save(doc);
                });
            }
        }

        return new AuthResponse(true, "User status updated to " + user.getStatus());
    }

    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(email.toLowerCase());
        }
        if (userOpt.isEmpty()) {
            // Return success even if not found to prevent email enumeration
            return new AuthResponse(true, "If an account exists with that email, a reset code has been sent.");
        }
        
        User user = userOpt.get();
        SecureRandom secureRandom = new SecureRandom();
        String resetToken = String.format("%06d", secureRandom.nextInt(1_000_000));
        Instant expiry = Instant.now().plusSeconds(15 * 60);
        
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(expiry);
        userRepository.save(user);

        // Also sync reset token to doctors collection if account is a doctor
        try {
            doctorRepository.findFirstByEmailIgnoreCase(email).ifPresent(doc -> {
                doc.setResetToken(resetToken);
                doc.setResetTokenExpiry(expiry);
                doctorRepository.save(doc);
            });
        } catch (Exception ignored) { }
        
        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getName(),
                resetToken
        );
        
        return new AuthResponse(true, "A 6-digit reset code has been sent to your email. Check your inbox.");
    }

    public AuthResponse resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(email.toLowerCase());
        }
        if (userOpt.isEmpty()) {
            return new AuthResponse(false, "No account found for that email.");
        }
        
        User user = userOpt.get();
        
        if (user.getResetToken() == null || user.getResetTokenExpiry() == null) {
            return new AuthResponse(false, "No active reset request. Please use Forgot Password first.");
        }
        if (user.getResetTokenExpiry().isBefore(Instant.now())) {
            return new AuthResponse(false, "Reset code has expired. Please request a new one.");
        }
        if (!user.getResetToken().equals(request.getResetToken().trim())) {
            return new AuthResponse(false, "Invalid reset code.");
        }
        
        String newPassword = request.getNewPassword();
        user.setPassword(newPassword);
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        // Synchronize password update to doctors collection in MongoDB
        try {
            doctorRepository.findFirstByEmailIgnoreCase(email).ifPresent(doc -> {
                doc.setPassword(newPassword);
                doc.setResetToken(null);
                doc.setResetTokenExpiry(null);
                doctorRepository.save(doc);
            });
        } catch (Exception ignored) { }
        
        return new AuthResponse(true, "Password updated successfully. You can now sign in.");
    }
}
