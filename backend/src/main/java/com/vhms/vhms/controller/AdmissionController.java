package com.vhms.vhms.controller;

import com.vhms.vhms.dto.ProcessAdmissionRequest;
import com.vhms.vhms.dto.RejectAdmissionRequest;
import com.vhms.vhms.dto.RecommendAdmissionRequest;
import com.vhms.vhms.model.PetAdmission;
import com.vhms.vhms.service.AdmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admissions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class AdmissionController {

    private final AdmissionService admissionService;

    @PostMapping("/recommend")
    public ResponseEntity<PetAdmission> recommendAdmission(@Valid @RequestBody RecommendAdmissionRequest request) {
        PetAdmission created = admissionService.recommendAdmission(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/request")
    public ResponseEntity<PetAdmission> requestAdmission(@PathVariable String id) {
        PetAdmission updated = admissionService.requestAdmission(id);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<PetAdmission>> getAdmissions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String petOwnerId) {
        List<PetAdmission> admissions = admissionService.getAdmissions(status, petOwnerId);
        return ResponseEntity.ok(admissions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetAdmission> getAdmissionById(@PathVariable String id) {
        PetAdmission admission = admissionService.getAdmissionById(id);
        return ResponseEntity.ok(admission);
    }

    @PatchMapping("/{id}/process")
    public ResponseEntity<PetAdmission> processAdmission(
            @PathVariable String id,
            @Valid @RequestBody ProcessAdmissionRequest request) {
        PetAdmission processed = admissionService.processAdmission(id, request.getCageWardId());
        return ResponseEntity.ok(processed);
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<PetAdmission> rejectAdmission(
            @PathVariable String id,
            @Valid @RequestBody RejectAdmissionRequest request) {
        PetAdmission rejected = admissionService.rejectAdmission(id, request.getRejectionReason());
        return ResponseEntity.ok(rejected);
    }
}
