package com.vhms.vhms.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class MedicalRecordResponseDTO {
    private String id;
    private String petId;
    
    // Core pet details snapped into the EMR
    private String petName;
    private String species;
    private String breed;
    private Integer age;
    private Double weight;
    private String ownerName;
    
    // The history of consultations for this pet
    private List<ConsultationResponseDTO> pastConsultations;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
