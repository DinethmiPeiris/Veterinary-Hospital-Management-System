package com.vhms.vhms.dto.billing;

import java.util.ArrayList;
import java.util.List;

import com.vhms.vhms.model.InvoiceItem;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {

    private String invoiceNumber;
    private String appointmentId;
    private String appointmentNumber;

    @NotBlank(message = "Pet ID is required")
    private String petId;
    private String petName;
    private String petSpecies;

    @NotBlank(message = "Owner ID is required")
    private String ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    private String doctorId;
    private String doctorName;

    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @Builder.Default
    private double hospitalizationCharges = 0.0;
    private String hospitalizationDetails;

    @Builder.Default
    private double discountPercentage = 0.0;

    @Builder.Default
    private double taxPercentage = 0.0;

    private String dueDate;
    private String notes;
}
