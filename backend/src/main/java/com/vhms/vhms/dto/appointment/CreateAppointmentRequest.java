package com.vhms.vhms.dto.appointment;

import com.vhms.vhms.model.AppointmentType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {

    @NotBlank(message = "Pet ID is required")
    private String petId;
    
    @NotBlank(message = "Pet Name is required")
    private String petName;
    
    private String petSpecies;
    private String petBreed;
    private String petAge;

    @NotBlank(message = "Owner ID is required")
    private String ownerId;

    @NotBlank(message = "Owner Name is required")
    private String ownerName;

    @NotBlank(message = "Owner Phone is required")
    private String ownerPhone;

    private String ownerEmail;

    private String doctorId;

    private String doctorName;
    private String doctorSpecialization;

    @NotNull(message = "Appointment Type is required")
    private AppointmentType appointmentType;

    @NotBlank(message = "Appointment Date is required (YYYY-MM-DD)")
    private String appointmentDate;

    @NotBlank(message = "Time slot is required (e.g. 09:00 - 09:30)")
    private String timeSlot;

    private String reasonForVisit;
    private String symptoms;
    private String notes;
}
