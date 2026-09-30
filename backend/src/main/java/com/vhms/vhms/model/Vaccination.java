package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Embedded document representing a single vaccination within a medical record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vaccination {
    private String vaccineName;
    private LocalDate dateAdministered;
    private LocalDate nextDueDate;
    private String administeredBy;
    private String notes;
}
