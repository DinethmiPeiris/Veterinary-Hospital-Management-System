package com.vhms.vhms.service;

import com.vhms.vhms.dto.*;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.*;
import com.vhms.vhms.repository.CageWardRepository;
import com.vhms.vhms.repository.HospitalizationRepository;
import com.vhms.vhms.repository.PetAdmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class HospitalizationService {

    private final HospitalizationRepository hospitalizationRepository;
    private final CageWardRepository cageWardRepository;
    private final PetAdmissionRepository admissionRepository;

    private static final Set<String> VALID_RECOVERY_STATUSES = Set.of(
        "CRITICAL", "POOR", "STABLE", "IMPROVING", "RECOVERED"
    );

    public List<Hospitalization> getAllHospitalizations() {
        return hospitalizationRepository.findAll();
    }

    public List<Hospitalization> getActiveHospitalizations() {
        return hospitalizationRepository.findByStatusIn(List.of("ACTIVE", "DISCHARGE_RECOMMENDED"));
    }

    public Hospitalization getHospitalizationById(String id) {
        return hospitalizationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Hospitalization record not found with ID: " + id));
    }

    public Hospitalization getHospitalizationByAdmissionId(String admissionId) {
        return hospitalizationRepository.findByAdmissionId(admissionId)
            .orElseThrow(() -> new ResourceNotFoundException("Hospitalization record not found for Admission ID: " + admissionId));
    }

    public Hospitalization addTreatmentNote(String id, AddTreatmentNoteRequest request) {
        Hospitalization hospitalization = getHospitalizationById(id);
        ensureHospitalizationIsActive(hospitalization);

        if (request.getNote() == null || request.getNote().trim().isEmpty()) {
            throw new InvalidOperationException("Treatment note cannot be blank.");
        }

        if (hospitalization.getTreatmentNotes() == null) {
            hospitalization.setTreatmentNotes(new ArrayList<>());
        }

        TreatmentNote note = TreatmentNote.builder()
            .id(UUID.randomUUID().toString())
            .doctorId(request.getDoctorId() != null ? request.getDoctorId() : hospitalization.getDoctorId())
            .doctorName(request.getDoctorName() != null ? request.getDoctorName() : hospitalization.getDoctorName())
            .note(request.getNote().trim())
            .observation(request.getObservation() != null ? request.getObservation().trim() : "")
            .treatmentGiven(request.getTreatmentGiven() != null ? request.getTreatmentGiven().trim() : "")
            .createdAt(LocalDateTime.now())
            .build();

        hospitalization.getTreatmentNotes().add(note);
        return hospitalizationRepository.save(hospitalization);
    }

    public Hospitalization updateRecoveryProgress(String id, UpdateRecoveryProgressRequest request) {
        Hospitalization hospitalization = getHospitalizationById(id);
        ensureHospitalizationIsActive(hospitalization);

        String status = request.getRecoveryStatus() != null ? request.getRecoveryStatus().trim().toUpperCase() : "";
        if (!VALID_RECOVERY_STATUSES.contains(status)) {
            throw new InvalidOperationException("Invalid recovery status: " + status + ". Allowed: CRITICAL, POOR, STABLE, IMPROVING, RECOVERED.");
        }

        LocalDateTime now = LocalDateTime.now();
        hospitalization.setRecoveryStatus(status);
        hospitalization.setRecoveryNote(request.getRecoveryNote() != null ? request.getRecoveryNote().trim() : "");
        hospitalization.setRecoveryUpdatedAt(now);
        hospitalization.setUpdatedByDoctorId(request.getDoctorId() != null ? request.getDoctorId() : hospitalization.getDoctorId());
        hospitalization.setUpdatedByDoctorName(request.getDoctorName() != null ? request.getDoctorName() : hospitalization.getDoctorName());

        if (hospitalization.getRecoveryHistory() == null) {
            hospitalization.setRecoveryHistory(new ArrayList<>());
        }

        RecoveryProgressEntry historyEntry = RecoveryProgressEntry.builder()
            .id(UUID.randomUUID().toString())
            .recoveryStatus(status)
            .recoveryNote(request.getRecoveryNote() != null ? request.getRecoveryNote().trim() : "")
            .doctorId(hospitalization.getUpdatedByDoctorId())
            .doctorName(hospitalization.getUpdatedByDoctorName())
            .recordedAt(now)
            .build();

        hospitalization.getRecoveryHistory().add(historyEntry);
        return hospitalizationRepository.save(hospitalization);
    }

    public Hospitalization addMedicationInstruction(String id, AddMedicationInstructionRequest request) {
        Hospitalization hospitalization = getHospitalizationById(id);
        ensureHospitalizationIsActive(hospitalization);

        if (request.getMedicineName() == null || request.getMedicineName().trim().isEmpty()) {
            throw new InvalidOperationException("Medicine name is required.");
        }
        if (request.getAdministrationInstructions() == null || request.getAdministrationInstructions().trim().isEmpty()) {
            throw new InvalidOperationException("Administration instruction cannot be blank.");
        }

        if (hospitalization.getMedicationInstructions() == null) {
            hospitalization.setMedicationInstructions(new ArrayList<>());
        }

        MedicationInstruction instruction = MedicationInstruction.builder()
            .id(UUID.randomUUID().toString())
            .medicineName(request.getMedicineName().trim())
            .dosage(request.getDosage() != null ? request.getDosage().trim() : "")
            .frequency(request.getFrequency() != null ? request.getFrequency().trim() : "")
            .administrationInstructions(request.getAdministrationInstructions().trim())
            .notes(request.getNotes() != null ? request.getNotes().trim() : "")
            .doctorId(request.getDoctorId() != null ? request.getDoctorId() : hospitalization.getDoctorId())
            .doctorName(request.getDoctorName() != null ? request.getDoctorName() : hospitalization.getDoctorName())
            .createdAt(LocalDateTime.now())
            .build();

        hospitalization.getMedicationInstructions().add(instruction);
        return hospitalizationRepository.save(hospitalization);
    }

    public Hospitalization recommendDischarge(String id, RecommendDischargeRequest request) {
        Hospitalization hospitalization = getHospitalizationById(id);

        if ("DISCHARGED".equalsIgnoreCase(hospitalization.getStatus())) {
            throw new InvalidOperationException("Pet has already been discharged.");
        }

        if (request.getRecommendationReason() == null || request.getRecommendationReason().trim().isEmpty()) {
            throw new InvalidOperationException("Discharge recommendation reason cannot be blank.");
        }

        LocalDateTime now = LocalDateTime.now();
        hospitalization.setStatus("DISCHARGE_RECOMMENDED");
        hospitalization.setDischargeRecommended(true);
        hospitalization.setDischargeRecommendationReason(request.getRecommendationReason().trim());
        hospitalization.setDischargeRecommendedAt(now);
        hospitalization.setDischargeRecommendedByDoctorId(request.getDoctorId() != null ? request.getDoctorId() : hospitalization.getDoctorId());
        hospitalization.setDischargeRecommendedByDoctorName(request.getDoctorName() != null ? request.getDoctorName() : hospitalization.getDoctorName());

        return hospitalizationRepository.save(hospitalization);
    }

    public Hospitalization confirmDischarge(String id, ConfirmDischargeRequest request) {
        Hospitalization hospitalization = getHospitalizationById(id);

        if ("DISCHARGED".equalsIgnoreCase(hospitalization.getStatus())) {
            throw new InvalidOperationException("Hospitalization is already discharged and completed.");
        }

        if (!Boolean.TRUE.equals(hospitalization.getDischargeRecommended()) &&
            !"DISCHARGE_RECOMMENDED".equalsIgnoreCase(hospitalization.getStatus())) {
            throw new InvalidOperationException("Discharge requires Doctor recommendation before Admin confirmation.");
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Update Hospitalization
        hospitalization.setStatus("DISCHARGED");
        hospitalization.setDischargedAt(now);
        hospitalization.setDischargeNotes(request != null && request.getDischargeNotes() != null ? request.getDischargeNotes().trim() : "");
        hospitalization.setDischargedByAdminId(request != null && request.getAdminId() != null ? request.getAdminId() : "ADMIN-01");
        Hospitalization savedHospitalization = hospitalizationRepository.save(hospitalization);

        // 2. Update related PetAdmission to DISCHARGED
        if (hospitalization.getAdmissionId() != null) {
            admissionRepository.findById(hospitalization.getAdmissionId()).ifPresent(admission -> {
                admission.setStatus("DISCHARGED");
                admissionRepository.save(admission);
            });
        }

        // 3. Release Cage/Ward: OCCUPIED -> AVAILABLE
        if (hospitalization.getCageWardId() != null) {
            cageWardRepository.findById(hospitalization.getCageWardId()).ifPresent(cage -> {
                cage.setStatus("AVAILABLE");
                cageWardRepository.save(cage);
            });
        }

        return savedHospitalization;
    }

    private void ensureHospitalizationIsActive(Hospitalization hospitalization) {
        if ("DISCHARGED".equalsIgnoreCase(hospitalization.getStatus())) {
            throw new InvalidOperationException("Cannot update a discharged hospitalization. Hospitalization is closed.");
        }
    }
}
