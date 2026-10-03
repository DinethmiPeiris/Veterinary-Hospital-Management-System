package com.vhms.vhms.model;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.Data;

@Data
@Document(collection = "doctors")
public class Doctor {

    @Id
    private String id;

    @Indexed(unique = true)
    private String staffId;

    @Indexed(unique = true, sparse = true)
    private String username;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String phone;

    private String password;

    private String specialization;

    private List<String> availableServices = new ArrayList<>();

    private List<String> availableSlots = new ArrayList<>();

    @Field("isActive")
    private boolean active = true;

    private String role = "DOCTOR";

    private LocalDateTime createdAt = LocalDateTime.now();

    /** Short-lived password reset support (no email server required for demo). */
    private String resetToken;
    private Instant resetTokenExpiry;

    // ---- Fields added by IT24101204 (pet-owner portal / admin dashboard) ----
    private String name;
    private String availableHours;
    private String workingDays;
    private String photoUrl;
    private String bio;
    private String experience;

    public Doctor() {
    }

    /** Convenience constructor used by IT24101204 (seeding, admin-created doctors, user sync). */
    public Doctor(String staffId, String fullName, String email, String phone, String password,
            String specialization) {
        this.staffId = staffId;
        this.username = email != null && email.contains("@") ? email.split("@")[0] : email;
        this.fullName = fullName;
        this.name = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.specialization = specialization;
        this.availableHours = "Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM";
        this.workingDays = "Mon - Sun";
        this.availableServices = new ArrayList<>(
                Arrays.asList("OPD Consultation", "Surgery & Trauma", "Vaccination", "Emergency Care"));
        this.availableSlots = new ArrayList<>(Arrays.asList("11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
                "01:00 PM", "01:30 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"));
        this.active = true;
        this.role = "DOCTOR";
        this.createdAt = LocalDateTime.now();
    }
}
