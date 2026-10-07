package com.vhms.vhms.service;

import com.vhms.vhms.dto.RecommendAdmissionRequest;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.CageWard;
import com.vhms.vhms.model.Hospitalization;
import com.vhms.vhms.model.PetAdmission;
import com.vhms.vhms.model.NotificationType;
import com.vhms.vhms.repository.CageWardRepository;
import com.vhms.vhms.repository.HospitalizationRepository;
import com.vhms.vhms.repository.PetAdmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdmissionService {

    private final PetAdmissionRepository admissionRepository;
    private final CageWardRepository cageWardRepository;
    private final HospitalizationRepository hospitalizationRepository;
    private final NotificationService notificationService;

    public PetAdmission recommendAdmission(RecommendAdmissionRequest request) {
        PetAdmission admission = PetAdmission.builder()
            .petId(request.getPetId() != null ? request.getPetId() : "PET-DEMO-001")
            .petOwnerId(request.getPetOwnerId() != null ? request.getPetOwnerId() : "OWNER-DEMO-001")
            .doctorId(request.getDoctorId() != null ? request.getDoctorId() : "DOC-DEMO-001")
            .consultationId(request.getConsultationId() != null ? request.getConsultationId() : "CONS-DEMO-001")
            .recommendationReason(request.getRecommendationReason())
            .recommendedAt(LocalDateTime.now())
            .status("RECOMMENDED")
            .petName(request.getPetName() != null ? request.getPetName() : "Buddy")
            .petSpecies(request.getPetSpecies() != null ? request.getPetSpecies() : "Dog (Golden Retriever)")
            .ownerName(request.getOwnerName() != null ? request.getOwnerName() : "Sunil Perera")
            .doctorName(request.getDoctorName() != null ? request.getDoctorName() : "Dr. Nimal Fernando")
            .build();

        PetAdmission saved = admissionRepository.save(admission);

        // Send notification to Pet Owner
        notificationService.sendNotification(
                saved.getPetOwnerId(),
                "PET_OWNER",
                null,
                null,
                NotificationType.HOSPITALIZATION_RECOMMENDED,
                "Hospitalization Recommended 🏥",
                String.format("Dr. %s has recommended hospitalization for %s. Please review and approve the request.",
                        saved.getDoctorName().replace("Dr. ", ""), saved.getPetName()),
                "ADMISSION",
                saved.getId()
        );

        return saved;
    }

    public PetAdmission requestAdmission(String admissionId) {
        PetAdmission admission = getAdmissionById(admissionId);

        if (!"RECOMMENDED".equalsIgnoreCase(admission.getStatus())) {
            throw new InvalidOperationException("Admission request can only be submitted for admissions in RECOMMENDED status. Current status: " + admission.getStatus());
        }

        admission.setStatus("REQUESTED");
        admission.setRequestedAt(LocalDateTime.now());
        return admissionRepository.save(admission);
    }

    public PetAdmission processAdmission(String admissionId, String cageWardId) {
        PetAdmission admission = getAdmissionById(admissionId);

        if (!"REQUESTED".equalsIgnoreCase(admission.getStatus())) {
            throw new InvalidOperationException("Only REQUESTED admissions can be processed by Admin. Current status: " + admission.getStatus());
        }

        CageWard cageWard = cageWardRepository.findById(cageWardId)
            .orElseThrow(() -> new ResourceNotFoundException("Cage/Ward not found with ID: " + cageWardId));

        if (!"AVAILABLE".equalsIgnoreCase(cageWard.getStatus())) {
            throw new InvalidOperationException("Selected Cage/Ward (" + cageWard.getCode() + ") is not available. Status: " + cageWard.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Update Admission status and details
        admission.setStatus("ADMITTED");
        admission.setAdmittedAt(now);
        admission.setAssignedCageWardId(cageWardId);
        admission.setCageCode(cageWard.getCode());
        PetAdmission savedAdmission = admissionRepository.save(admission);

        // 2. Mark Cage as OCCUPIED
        cageWard.setStatus("OCCUPIED");
        cageWardRepository.save(cageWard);

        // 3. Create ACTIVE Hospitalization record
        Hospitalization hospitalization = Hospitalization.builder()
            .admissionId(savedAdmission.getId())
            .petId(savedAdmission.getPetId())
            .petOwnerId(savedAdmission.getPetOwnerId())
            .doctorId(savedAdmission.getDoctorId())
            .cageWardId(cageWardId)
            .admittedAt(now)
            .status("ACTIVE")
            .petName(savedAdmission.getPetName())
            .petSpecies(savedAdmission.getPetSpecies())
            .ownerName(savedAdmission.getOwnerName())
            .doctorName(savedAdmission.getDoctorName())
            .cageCode(cageWard.getCode())
            .build();

        hospitalizationRepository.save(hospitalization);

        return savedAdmission;
    }

    public PetAdmission rejectAdmission(String admissionId, String rejectionReason) {
        PetAdmission admission = getAdmissionById(admissionId);

        if (!"REQUESTED".equalsIgnoreCase(admission.getStatus())) {
            throw new InvalidOperationException(
                "Only REQUESTED admissions can be rejected. Current status: " + admission.getStatus());
        }

        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new InvalidOperationException("Rejection reason is required and cannot be blank.");
        }

        admission.setStatus("REJECTED");
        admission.setRejectionReason(rejectionReason.trim());
        admission.setRejectedAt(LocalDateTime.now());
        return admissionRepository.save(admission);
    }

    public List<PetAdmission> getAdmissions(String status, String petOwnerId) {
        List<PetAdmission> results;

        boolean hasStatus = status != null && !status.trim().isEmpty();
        boolean hasOwner  = petOwnerId != null && !petOwnerId.trim().isEmpty();

        if (hasOwner && hasStatus) {
            // Combined filter: owner + status
            results = admissionRepository.findByPetOwnerIdAndStatus(petOwnerId, status.toUpperCase());
        } else if (hasOwner) {
            // Filter by owner only
            results = admissionRepository.findByPetOwnerId(petOwnerId);
        } else if (hasStatus) {
            // Filter by status only
            results = admissionRepository.findByStatus(status.toUpperCase());
        } else {
            results = admissionRepository.findAll();
        }

        return results;
    }

    // Backward-compatible overload for internal use
    public List<PetAdmission> getAdmissions(String status) {
        return getAdmissions(status, null);
    }

    public PetAdmission getAdmissionById(String id) {
        return admissionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Admission record not found with ID: " + id));
    }
}
