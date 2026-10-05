package com.vhms.vhms.dto.billing;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddHospitalizationChargeRequest {

    @Min(value = 0, message = "Hospitalization charge cannot be negative")
    private double hospitalizationCharges;

    @NotBlank(message = "Hospitalization details / cage breakdown required")
    private String hospitalizationDetails;
}
