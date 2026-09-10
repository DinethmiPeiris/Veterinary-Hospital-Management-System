package com.vhms.vhms.dto;

import lombok.Data;

@Data
public class AppointmentResponseDTO {
    private String id;
    private String time;
    private String patient;
    private String species;
    private String breed;
    private String owner;
    private String reason;
    private String status;
    private String petId;
    private String doctorId;
    private String doctorName;
}
