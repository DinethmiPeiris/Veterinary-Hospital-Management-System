package com.vhms.vhms.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DoctorAuthResponse {
    private String id;
    private String staffId;
    private String username;
    private String fullName;
    private String email;
    private String specialization;
    private String role;
    private String message;
    private String resetToken;
}
