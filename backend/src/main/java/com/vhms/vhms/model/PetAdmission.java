package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "pet_admissions")
public class PetAdmission {

    @Id
    private String id;
    private String petId;
    private String petOwnerId;
    private String doctorId;
    private String consultationId;
    private String recommendationReason;
    private LocalDateTime recommendedAt;
    private LocalDateTime requestedAt;
    private LocalDateTime admittedAt;
    private String assignedCageWardId;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    // Lifecycle Statuses: RECOMMENDED, REQUESTED, ADMITTED, REJECTED
    private String status;

    // Temporary integration fields for display when referenced modules are pending
    private String petName;
    private String petSpecies;
    private String ownerName;
    private String doctorName;
    private String cageCode;
}
