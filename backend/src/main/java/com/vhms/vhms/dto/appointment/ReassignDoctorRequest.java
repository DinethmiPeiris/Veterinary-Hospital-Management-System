package com.vhms.vhms.dto.appointment;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReassignDoctorRequest {

    @NotBlank(message = "New Doctor ID is required")
    private String newDoctorId;

    @NotBlank(message = "New Doctor Name is required")
    private String newDoctorName;

    private String newDoctorSpecialization;
    private String newAppointmentDate; // optional if keeping same
    private String newTimeSlot;        // optional if keeping same
    private String reassignmentReason;
}
