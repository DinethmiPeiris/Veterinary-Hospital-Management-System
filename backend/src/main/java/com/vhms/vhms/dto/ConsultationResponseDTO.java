package com.vhms.vhms.dto;

import com.vhms.vhms.model.ConsultationStatus;
import com.vhms.vhms.model.VitalSigns;
import com.vhms.vhms.model.Prescription;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ConsultationResponseDTO {
    private String id;
    private String medicalRecordId;
    private String appointmentId;
    private String petId;
    private String doctorId;
    
    private String petName;
    private String ownerName;
    private String doctorName;
    
    private LocalDateTime consultationDate;
    private ConsultationStatus status;
    
    private String symptoms;
    private String observations;
    private VitalSigns vitalSigns;
    private String diagnosis;
    private String diagnosisSeverity;
    private String treatmentPlan;
    private String treatmentType;
    private String treatmentDuration;
    private List<Prescription> prescriptions;
    private String notes;
    private LocalDate followUpDate;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
