package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationInstruction {
    private String id;
    private String medicineName;
    private String dosage;
    private String frequency;
    private String administrationInstructions;
    private String notes;
    private String doctorId;
    private String doctorName;
    private LocalDateTime createdAt;
}
