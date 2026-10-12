package com.vhms.vhms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank(message = "Email is required")
    private String email;

    private String oldPassword;

    @NotBlank(message = "New password is required")
    private String newPassword;
}
