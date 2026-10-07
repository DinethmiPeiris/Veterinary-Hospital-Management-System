package com.vhms.vhms.controller;

import com.vhms.vhms.dto.*;
import com.vhms.vhms.model.Hospitalization;
import com.vhms.vhms.service.HospitalizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hospitalizations")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class HospitalizationController {

    private final HospitalizationService hospitalizationService;

    @GetMapping
    public ResponseEntity<List<Hospitalization>> getAllHospitalizations() {
        return ResponseEntity.ok(hospitalizationService.getAllHospitalizations());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Hospitalization>> getActiveHospitalizations() {
        return ResponseEntity.ok(hospitalizationService.getActiveHospitalizations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hospitalization> getHospitalizationById(@PathVariable String id) {
        return ResponseEntity.ok(hospitalizationService.getHospitalizationById(id));
    }

    @GetMapping("/admission/{admissionId}")
    public ResponseEntity<Hospitalization> getHospitalizationByAdmissionId(@PathVariable String admissionId) {
        return ResponseEntity.ok(hospitalizationService.getHospitalizationByAdmissionId(admissionId));
    }

    @PostMapping("/{id}/treatment-notes")
    public ResponseEntity<Hospitalization> addTreatmentNote(
            @PathVariable String id,
            @Valid @RequestBody AddTreatmentNoteRequest request) {
        Hospitalization updated = hospitalizationService.addTreatmentNote(id, request);
        return new ResponseEntity<>(updated, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/recovery")
    public ResponseEntity<Hospitalization> updateRecoveryProgress(
            @PathVariable String id,
            @Valid @RequestBody UpdateRecoveryProgressRequest request) {
        Hospitalization updated = hospitalizationService.updateRecoveryProgress(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/medication-instructions")
    public ResponseEntity<Hospitalization> addMedicationInstruction(
            @PathVariable String id,
            @Valid @RequestBody AddMedicationInstructionRequest request) {
        Hospitalization updated = hospitalizationService.addMedicationInstruction(id, request);
        return new ResponseEntity<>(updated, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/recommend-discharge")
    public ResponseEntity<Hospitalization> recommendDischarge(
            @PathVariable String id,
            @Valid @RequestBody RecommendDischargeRequest request) {
        Hospitalization updated = hospitalizationService.recommendDischarge(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/confirm-discharge")
    public ResponseEntity<Hospitalization> confirmDischarge(
            @PathVariable String id,
            @RequestBody(required = false) ConfirmDischargeRequest request) {
        Hospitalization updated = hospitalizationService.confirmDischarge(id, request);
        return ResponseEntity.ok(updated);
    }
}
