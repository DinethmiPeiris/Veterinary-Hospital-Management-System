package com.vhms.vhms.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.model.Doctor;
import com.vhms.vhms.repository.DoctorRepository;

/**
 * Public doctor directory for the pet-owner booking UI. Exposes the doctors collection (including doctors
 * registered through the doctor workflow) without any credentials, so pet owners can book any active doctor.
 */
@RestController
@RequestMapping("/api/v1/doctors")
@CrossOrigin(origins = "*")
public class DoctorDirectoryController {

    @Autowired
    private DoctorRepository doctorRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listDoctors() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Doctor d : doctorRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            String name = d.getFullName() != null ? d.getFullName() : d.getName();
            m.put("id", d.getStaffId() != null ? d.getStaffId() : d.getId());
            m.put("staffId", d.getStaffId());
            m.put("name", name);
            m.put("fullName", name);
            m.put("email", d.getEmail());
            m.put("phone", d.getPhone());
            m.put("role", "DOCTOR");
            m.put("status", d.isActive() ? "ON_DUTY" : "INACTIVE");
            m.put("specialization", d.getSpecialization());
            m.put("photoUrl", d.getPhotoUrl());
            m.put("bio", d.getBio());
            m.put("experience", d.getExperience());
            m.put("availableServices", d.getAvailableServices());
            m.put("availableSlots", d.getAvailableSlots());
            m.put("availableHours", d.getAvailableHours());
            m.put("workingDays", d.getWorkingDays());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }
}
