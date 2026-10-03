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
public class RecoveryProgressEntry {
    private String id;
    private String recoveryStatus;
    private String recoveryNote;
    private String doctorId;
    private String doctorName;
    private LocalDateTime recordedAt;
}
