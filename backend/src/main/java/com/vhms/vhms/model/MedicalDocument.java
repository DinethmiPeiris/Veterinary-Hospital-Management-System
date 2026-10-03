package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Embedded document representing a medical document attachment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalDocument {
    private String documentId;
    private String fileName;
    private String fileType;
    private String base64Data; // For prototype simplicity
    private String description;
    private LocalDateTime uploadedAt;
}
