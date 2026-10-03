package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentNote {
    private String id;
    private String doctorId;
    private String doctorName;
    private String note;
    private String observation;
    private String treatmentGiven;
    private LocalDateTime createdAt;
}
