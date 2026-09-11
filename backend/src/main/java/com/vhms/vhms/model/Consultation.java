package com.vhms.vhms.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One document per consultation session.
 *
 * Linked to a MedicalRecord (EMR) via medicalRecordId and to an
 * Appointment via appointmentId.  Embeds VitalSigns and a list of
 * Prescription objects directly rather than referencing separate
 * collections, keeping all clinical data for a single visit together.
 *
 * Architecture note (Epic 1 dependency):
 *   appointmentId, petId, doctorId are String references to documents
 *   that will be managed by Epic 1 (User, Pet, Appointment).  During
 *   Sprint 1 these are populated from seed data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "consultations")
public class Consultation {

    @Id
    private String id;

    // ── References ──────────────────────────────────────────────────
    private String medicalRecordId;
    private String appointmentId;
    private String petId;
    private String doctorId;

    // ── Snapshot fields (denormalized for display convenience) ──────
    private String petName;
    private String ownerName;
    private String doctorName;

    // ── Timing ──────────────────────────────────────────────────────
    private LocalDateTime consultationDate;

    // ── Status ──────────────────────────────────────────────────────
    private ConsultationStatus status;

    // ── Clinical Data ───────────────────────────────────────────────
    private String symptoms;
    private String observations;
    private VitalSigns vitalSigns;
    private String diagnosis;
    private String diagnosisSeverity;      // e.g. "Mild", "Moderate", "Severe"
    private String treatmentPlan;
    private String treatmentType;          // e.g. "Medication", "Surgery", "Therapy"
    private String treatmentDuration;
    private List<Prescription> prescriptions = new ArrayList<>();
    private String notes;
    private LocalDate followUpDate;

    // ── Audit ───────────────────────────────────────────────────────
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
