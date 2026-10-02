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
public class AddTreatmentNoteRequest {

    @NotBlank(message = "Treatment note cannot be blank.")
    private String note;

    private String observation;
    private String treatmentGiven;
    private String doctorId;
    private String doctorName;
}
