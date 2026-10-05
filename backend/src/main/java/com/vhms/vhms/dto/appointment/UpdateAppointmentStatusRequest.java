package com.vhms.vhms.dto.appointment;

import com.vhms.vhms.model.AppointmentStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAppointmentStatusRequest {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;

    private String reason; // Rejection or Cancellation reason
    private String cancelledBy; // "ADMIN", "DOCTOR", "OWNER"
    private String doctorNotes;
    private String adminNotes;
}
