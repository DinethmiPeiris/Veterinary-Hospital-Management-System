package com.vhms.vhms.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.DoctorAuthResponse;
import com.vhms.vhms.dto.DoctorLoginRequest;
import com.vhms.vhms.dto.DoctorRegisterRequest;
import com.vhms.vhms.dto.ForgotPasswordRequest;
import com.vhms.vhms.dto.ResetPasswordRequest;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Doctor;
import com.vhms.vhms.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorAuthService {

    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public DoctorAuthResponse register(DoctorRegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = normalizeUsername(request.getUsername());
        if (doctorRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("A doctor account with this email already exists.");
        }
        if (doctorRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("This username is already taken. Choose another one.");
        }

        Doctor doctor = new Doctor();
        doctor.setStaffId(generateStaffId());
        doctor.setUsername(username);
        doctor.setFullName(request.getFullName().trim());
        doctor.setEmail(email);
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setPassword(passwordEncoder.encode(request.getPassword()));
        doctor.setActive(true);
        doctor.setRole("DOCTOR");
        doctor.setCreatedAt(LocalDateTime.now());

        doctor = doctorRepository.save(doctor);
        return toAuthResponse(doctor, "Doctor registered successfully. Username: " + doctor.getUsername()
                + " · Staff ID: " + doctor.getStaffId());
    }

    public DoctorAuthResponse login(DoctorLoginRequest request) {
        Doctor doctor = findByIdentifier(request.getIdentifier().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username/Staff ID or password."));

        if (!doctor.isActive()) {
            throw new IllegalArgumentException("This doctor account is inactive.");
        }

        if (!passwordMatches(request.getPassword(), doctor.getPassword())) {
            throw new IllegalArgumentException("Invalid username/Staff ID or password.");
        }

        if (doctor.getUsername() == null || doctor.getUsername().isBlank()) {
            doctor.setUsername(ensureUniqueUsername(fallbackUsername(doctor)));
            doctorRepository.save(doctor);
        }

        return toAuthResponse(doctor, "Login successful");
    }

    public DoctorAuthResponse forgotPassword(ForgotPasswordRequest request) {
        Doctor doctor = doctorRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("No doctor account found for that email."));

        String resetToken = String.format("%06d", secureRandom.nextInt(1_000_000));
        doctor.setResetToken(resetToken);
        doctor.setResetTokenExpiry(Instant.now().plusSeconds(15 * 60));
        doctorRepository.save(doctor);

        return DoctorAuthResponse.builder()
                .email(doctor.getEmail())
                .fullName(doctor.getFullName())
                .resetToken(resetToken)
                .message("Reset code generated. Use it within 15 minutes to set a new password.")
                .build();
    }

    public DoctorAuthResponse resetPassword(ResetPasswordRequest request) {
        Doctor doctor = doctorRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("No doctor account found for that email."));

        if (doctor.getResetToken() == null || doctor.getResetTokenExpiry() == null) {
            throw new IllegalArgumentException("No active reset request. Please use Forgot Password first.");
        }
        if (doctor.getResetTokenExpiry().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset code has expired. Please request a new one.");
        }
        if (!doctor.getResetToken().equals(request.getResetToken().trim())) {
            throw new IllegalArgumentException("Invalid reset code.");
        }

        doctor.setPassword(passwordEncoder.encode(request.getNewPassword()));
        doctor.setResetToken(null);
        doctor.setResetTokenExpiry(null);
        doctorRepository.save(doctor);

        return DoctorAuthResponse.builder()
                .email(doctor.getEmail())
                .staffId(doctor.getStaffId())
                .fullName(doctor.getFullName())
                .message("Password updated successfully. You can now sign in.")
                .build();
    }

    private Optional<Doctor> findByIdentifier(String identifier) {
        Optional<Doctor> byUsername = doctorRepository.findByUsernameIgnoreCase(identifier);
        if (byUsername.isPresent()) return byUsername;

        return doctorRepository.findByStaffIdIgnoreCase(identifier);
    }

    private String normalizeUsername(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Username is required.");
        }
        String username = raw.trim().toLowerCase();
        if (!username.matches("^[a-z0-9._-]{3,30}$")) {
            throw new IllegalArgumentException("Username can only use letters, numbers, dots, hyphens, and underscores.");
        }
        return username;
    }

    private String fallbackUsername(Doctor doctor) {
        if (doctor.getEmail() != null && doctor.getEmail().contains("@")) {
            return doctor.getEmail().substring(0, doctor.getEmail().indexOf('@')).toLowerCase()
                    .replaceAll("[^a-z0-9._-]", "");
        }
        if (doctor.getStaffId() != null) {
            return doctor.getStaffId().toLowerCase().replaceAll("[^a-z0-9._-]", "");
        }
        return "doctor";
    }

    private String ensureUniqueUsername(String base) {
        String candidate = (base == null || base.isBlank()) ? "doctor" : base;
        if (candidate.length() < 3) candidate = candidate + "doc";
        String original = candidate;
        int suffix = 1;
        while (doctorRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = original + suffix;
            suffix++;
        }
        return candidate;
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }
        // Support existing bcrypt hashes and any legacy plaintext seed rows
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        return storedPassword.equals(rawPassword);
    }

    private String generateStaffId() {
        long next = doctorRepository.count() + 1;
        String candidate;
        do {
            candidate = String.format("SJAH-DOC-%03d", next);
            next++;
        } while (doctorRepository.existsByStaffIdIgnoreCase(candidate));
        return candidate;
    }

    private DoctorAuthResponse toAuthResponse(Doctor doctor, String message) {
        return DoctorAuthResponse.builder()
                .id(doctor.getId())
                .staffId(doctor.getStaffId())
                .username(doctor.getUsername())
                .fullName(doctor.getFullName())
                .email(doctor.getEmail())
                .specialization(doctor.getSpecialization())
                .role(doctor.getRole())
                .message(message)
                .build();
    }
}
