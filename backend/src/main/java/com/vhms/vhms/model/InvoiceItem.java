package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItem {

    private String itemId; // optional code, e.g. "SRV-CONSULT-01"
    private ItemType itemType; // CONSULTATION, MEDICATION, PROCEDURE, LAB_TEST, SURGERY, HOSPITALIZATION
    private String description;
    private int quantity;
    private double unitPrice;
    private double totalPrice;
}
