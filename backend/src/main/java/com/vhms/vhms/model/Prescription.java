package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embedded document representing a single prescription within a consultation.
 * Structured fields for clear, unambiguous medication instructions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {

    private String medicationName;
    private String dosage;        // e.g. "250mg"
    private String frequency;     // e.g. "Twice daily"
    private String duration;      // e.g. "5 days"
    private String route;         // e.g. "ORAL", "INJECTION", "TOPICAL"
    private String instructions;  // e.g. "Give with food"
}
