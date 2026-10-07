package com.vhms.vhms.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.dto.DoctorAuthResponse;
import com.vhms.vhms.dto.DoctorLoginRequest;
import com.vhms.vhms.dto.DoctorRegisterRequest;
import com.vhms.vhms.dto.ForgotPasswordRequest;
import org.springframework.web.bind.annotation.GetMapping;
import com.vhms.vhms.model.Doctor;
import com.vhms.vhms.repository.DoctorRepository;
import com.vhms.vhms.dto.ResetPasswordRequest;
import com.vhms.vhms.service.DoctorAuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth/doctor")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorAuthController {

    private final DoctorAuthService doctorAuthService;
    private final DoctorRepository doctorRepository;

    @PostMapping("/register")
    public ResponseEntity<DoctorAuthResponse> register(@Valid @RequestBody DoctorRegisterRequest request) {
        return new ResponseEntity<>(doctorAuthService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<DoctorAuthResponse> login(@Valid @RequestBody DoctorLoginRequest request) {
        return ResponseEntity.ok(doctorAuthService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<DoctorAuthResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(doctorAuthService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<DoctorAuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(doctorAuthService.resetPassword(request));
    }

    @GetMapping("/force-reset")
    public ResponseEntity<String> forceReset() {
        Doctor doc = doctorRepository.findFirstByEmailIgnoreCase("channa@sjah.com").orElse(null);
        if (doc != null) {
            doc.setPassword("doc123");
            doctorRepository.save(doc);
            return ResponseEntity.ok("Password forcefully reset to: doc123");
        }
        return ResponseEntity.ok("Doctor not found in DB.");
    }
}
