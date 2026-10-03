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
    // SCHEDULED, WAITING, IN_PROGRESS, COMPLETED, CANCELLED (doctor workflow)
    // plus PENDING, APPROVED, REJECTED (pet-owner booking / approval flow)
    private String status;

    // ---- Pet-owner booking fields (from IT24101204) ----
    private String petOwnerId;
    private String petOwnerName;
    private String petOwnerEmail;
    private String petOwnerPhone;
    private String gender;
    private String photoUrl;
    private String doctorEmail;
    private String specialization;
    /** Booking date as entered by the pet owner (yyyy-MM-dd). */
    private String date;
    /** Booking slot as chosen by the pet owner (e.g. "11:00 AM"). */
    private String timeSlot;
    private String doctorNotes;
    private String prescriptions;
    private String diagnosis;
    private String rejectReason;
    private LocalDateTime createdAt = LocalDateTime.now();
}
