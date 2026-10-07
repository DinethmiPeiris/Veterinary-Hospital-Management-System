package com.vhms.vhms.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "appointments")
@CompoundIndex(name = "doctor_date_slot_idx", def = "{'doctorId': 1, 'appointmentDate': 1, 'timeSlot': 1, 'status': 1}")
public class Appointment {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String appointmentNumber; // e.g. APT-20260827-001

    @Indexed
    private String petId;
    private String petName;
    private String petSpecies;
    private String petBreed;
    private String petAge;

    @Indexed
    private String ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;

    @Indexed
    private String doctorId;
    private String doctorName;
    private String doctorSpecialization;

    private AppointmentType appointmentType; // e.g. GENERAL_CHECKUP, VACCINATION, SURGERY

    @Indexed
    private String appointmentDate; // Format: YYYY-MM-DD
    private String timeSlot;        // Format: "09:00 - 09:30"

    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.REQUESTED;

    private String reasonForVisit;
    private String symptoms;
    private String doctorNotes;
    private String adminNotes;

    private String rejectionReason;
    private String cancellationReason;
    private String cancelledBy; // "ADMIN", "DOCTOR", "OWNER"

    // Reassignment details if applicable
    private String previousDoctorId;
    private String previousDoctorName;

    // Legacy fields for PetOwnerAppointmentController compatibility
    private String petOwnerName;
    private String petOwnerEmail;
    private String petOwnerPhone;
    private String petOwnerId;
    private String date;
    private String time;
    private String reason;
    private String doctorEmail;
    private String specialization;
    private String prescriptions;
    private String diagnosis;
    private String rejectReason;
    private String gender;
    private String photoUrl;
    private String breed;
    private Integer age;
    private Double weight;

    // Billing indicator
    @Builder.Default
    private boolean isBilled = false;
    private String invoiceId;

    // Admin authorization indicator for re-booking expired appointments
    @Builder.Default
    private boolean isRebookAllowed = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
