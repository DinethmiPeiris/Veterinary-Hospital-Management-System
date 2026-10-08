package com.vhms.vhms.controller;

import com.vhms.vhms.dto.AuthResponse;
import com.vhms.vhms.dto.RegisterRequest;
import com.vhms.vhms.model.User;
import com.vhms.vhms.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
public class UserAdminController {

    @Autowired
    private AuthService authService;

    @GetMapping("/users/pending")
    public ResponseEntity<List<User>> getPendingUsers() {
        return ResponseEntity.ok(authService.getPendingUsers());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PostMapping("/doctors")
    public ResponseEntity<AuthResponse> createDoctorAccount(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.createDoctorAccount(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<AuthResponse> approveUser(@PathVariable String id) {
        AuthResponse response = authService.approveUser(id);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(404).body(response);
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<AuthResponse> rejectUser(@PathVariable String id) {
        AuthResponse response = authService.rejectUser(id);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(404).body(response);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<AuthResponse> deleteUser(@PathVariable String id) {
        AuthResponse response = authService.deleteUser(id);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(404).body(response);
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<AuthResponse> toggleUserStatus(@PathVariable String id) {
        AuthResponse response = authService.toggleUserStatus(id);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(404).body(response);
    }
}
