package com.vhms.vhms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DoctorLoginRequest {
    @NotBlank(message = "Username or Staff ID is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}
