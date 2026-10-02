package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "hospitalizations")
public class Hospitalization {

    @Id
    private String id;
    private String admissionId;
    private String petId;
    private String petOwnerId;
    private String doctorId;
    private String cageWardId;
    private LocalDateTime admittedAt;

    // Status: ACTIVE, DISCHARGE_RECOMMENDED, DISCHARGED
    private String status;

    // Temporary integration fields for UI display
    private String petName;
    private String petSpecies;
    private String ownerName;
    private String doctorName;
    private String cageCode;

    // Daily Treatment Notes
    @Builder.Default
    private List<TreatmentNote> treatmentNotes = new ArrayList<>();

    // Inpatient Medication Instructions
    @Builder.Default
    private List<MedicationInstruction> medicationInstructions = new ArrayList<>();

    // Recovery Progress
    // Statuses: CRITICAL, POOR, STABLE, IMPROVING, RECOVERED
    private String recoveryStatus;
    private String recoveryNote;
    private LocalDateTime recoveryUpdatedAt;
    private String updatedByDoctorId;
    private String updatedByDoctorName;
    @Builder.Default
    private List<RecoveryProgressEntry> recoveryHistory = new ArrayList<>();

    // Discharge Recommendation
    private Boolean dischargeRecommended;
    private String dischargeRecommendationReason;
    private LocalDateTime dischargeRecommendedAt;
    private String dischargeRecommendedByDoctorId;
    private String dischargeRecommendedByDoctorName;

    // Final Discharge Information
    private LocalDateTime dischargedAt;
    private String dischargeNotes;
    private String dischargedByAdminId;
}
