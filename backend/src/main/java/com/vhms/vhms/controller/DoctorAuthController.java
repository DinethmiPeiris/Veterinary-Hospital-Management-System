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
}
