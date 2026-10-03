package com.vhms.vhms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectAdmissionRequest {

    @NotBlank(message = "Rejection reason is required and cannot be blank")
    private String rejectionReason;
}
