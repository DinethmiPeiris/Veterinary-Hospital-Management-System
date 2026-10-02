package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "medicine_requests")
public class MedicineRequest {

    @Id
    private String id;
    private String hospitalizationId;
    private String petId;
    private String petName;
    private String doctorId;
    private String doctorName;
    private String inventoryItemId;
    private String itemCode;
    private String itemName;
    private String category;
    private Integer requestedQuantity;
    private String unit;
    private String instructions;

    // Statuses: PENDING, ISSUED, UNAVAILABLE
    private String status;

    private LocalDateTime requestedAt;
    private LocalDateTime issuedAt;
    private String issuedBy;
    private String unavailableReason;
    private LocalDateTime unavailableAt;
}
