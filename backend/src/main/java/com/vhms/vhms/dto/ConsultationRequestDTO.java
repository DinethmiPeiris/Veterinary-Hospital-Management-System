package com.vhms.vhms.dto;

import com.vhms.vhms.model.VitalSigns;
import com.vhms.vhms.model.Prescription;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ConsultationRequestDTO {
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
    
    // Using a boolean flag for 'draft' vs 'complete'
    @com.fasterxml.jackson.annotation.JsonProperty("isDraft")
    private boolean draft;
}
