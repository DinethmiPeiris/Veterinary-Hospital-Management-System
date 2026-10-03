package com.vhms.vhms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendAdmissionRequest {

    private String petId;
    private String petOwnerId;
    private String doctorId;
    private String consultationId;

    @NotBlank(message = "Recommendation reason cannot be blank")
    private String recommendationReason;

    // Temporary integration display fields
    private String petName;
    private String petSpecies;
    private String ownerName;
    private String doctorName;
}
