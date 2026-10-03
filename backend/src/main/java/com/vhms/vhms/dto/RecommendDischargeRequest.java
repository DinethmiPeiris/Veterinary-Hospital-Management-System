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
public class RecommendDischargeRequest {

    @NotBlank(message = "Discharge recommendation reason cannot be blank.")
    private String recommendationReason;

    private String doctorId;
    private String doctorName;
}
