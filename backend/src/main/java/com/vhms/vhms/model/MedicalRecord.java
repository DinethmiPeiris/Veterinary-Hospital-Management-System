package com.vhms.vhms.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pet Electronic Medical Record (EMR).
 *
 * One MedicalRecord per pet (unique on petId). Acts as the top-level
 * container that links to all Consultation documents.
 *
 * Design decision — snapshot vs. reference:
 * petId is the authoritative reference to the Pets collection (Epic 1).
 * petName, ownerName, species, breed, dateOfBirth are stored as a
 * SNAPSHOT at creation time for display convenience. When Epic 1 is
 * implemented, a sync mechanism or on-read enrichment can keep these
 * fields consistent.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "medical_records")
public class MedicalRecord {

    @Id
    private String id;

    // ── Authoritative reference ─────────────────────────────────────
    @Indexed(unique = true)
    private String petId;

    // ── Snapshot fields (from Pets / PetOwners collections) ──────────
    private String petName;
    private String ownerName;
    private String ownerId;
    private String species;
    private String breed;
    private LocalDate dateOfBirth;
    private Integer age;
    private Double weight;

    // ── Medical metadata ────────────────────────────────────────────
    private List<String> allergies = new ArrayList<>();
    private List<String> chronicConditions = new ArrayList<>();

    // ── Audit ───────────────────────────────────────────────────────
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
