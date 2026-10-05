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
public class RescheduleAppointmentRequest {

    @NotBlank(message = "New appointment date is required (YYYY-MM-DD)")
    private String newAppointmentDate;

    @NotBlank(message = "New time slot is required (e.g. 10:00 - 10:30)")
    private String newTimeSlot;

    private String optionalNewDoctorId;
    private String optionalNewDoctorName;
    private String rescheduleReason;
}
