package com.vhms.vhms.model;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
}
