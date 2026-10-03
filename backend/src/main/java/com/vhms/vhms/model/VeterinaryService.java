package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Represents a veterinary service offered by the hospital.
 * Managed by Admin (US-E2-24).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "veterinary_services")
public class VeterinaryService {

    @Id
    private String id;

    private String name;           // e.g. "General Checkup"
    private String category;       // e.g. "Consultation", "Surgery", "Diagnostics"
    private String description;    // short description
    private Double price;          // in LKR
    private Integer durationMinutes; // estimated duration
    private boolean active = true; // soft-disable a service
}
