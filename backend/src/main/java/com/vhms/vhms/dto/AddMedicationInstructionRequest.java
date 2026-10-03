package com.vhms.vhms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddMedicationInstructionRequest {

    @NotBlank(message = "Medicine name is required.")
    private String medicineName;

    private String dosage;
    private String frequency;

    @NotBlank(message = "Administration instruction cannot be blank.")
    private String administrationInstructions;

    private String notes;
    private String doctorId;
    private String doctorName;
}
