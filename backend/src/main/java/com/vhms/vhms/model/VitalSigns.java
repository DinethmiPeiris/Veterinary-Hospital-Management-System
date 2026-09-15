package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embedded document for recording a pet's vital signs during consultation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VitalSigns {

    private Double weight;            // in kg
    private Double temperature;       // in °C
    private Integer heartRate;        // beats per minute
    private Integer respiratoryRate;  // breaths per minute
    private String bloodPressure;     // e.g. "120/80 mmHg"
}
