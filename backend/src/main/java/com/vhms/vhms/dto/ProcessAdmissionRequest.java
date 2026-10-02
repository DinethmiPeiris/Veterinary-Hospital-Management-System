package com.vhms.vhms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessAdmissionRequest {

    @NotBlank(message = "Cage/Ward ID is required to process admission")
    private String cageWardId;
}
