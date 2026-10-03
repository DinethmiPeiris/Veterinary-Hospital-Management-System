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
public class UpdateRecoveryProgressRequest {

    @NotBlank(message = "Recovery status is required.")
    private String recoveryStatus;

    private String recoveryNote;
    private String doctorId;
    private String doctorName;
}
