package com.vhms.vhms.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;

    private String petId;
    private String petName;
    private String species;
    private String breed;
    private Integer age;
    private Double weight;
    private String ownerName;
    private String doctorId;
    private String doctorName;
    private LocalDateTime appointmentDate;
    private String time;
    private String reason;
    private String status;
}
