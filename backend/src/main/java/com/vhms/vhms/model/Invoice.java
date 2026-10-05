package com.vhms.vhms.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "invoices")
public class Invoice {

    @Id
    private String id;

    @Indexed(unique = true)
    private String invoiceNumber; // e.g. INV-20260827-001

    @Indexed
    private String appointmentId;
    private String appointmentNumber;

    @Indexed
    private String petId;
    private String petName;
    private String petSpecies;

    @Indexed
    private String ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    @Indexed
    private String doctorId;
    private String doctorName;

    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    // Base subtotal from line items
    private double subtotal;

    // Hospitalization charges (US 4.27)
    @Builder.Default
    private double hospitalizationCharges = 0.0;
    private String hospitalizationDetails;

    // Discounts & Taxes
    @Builder.Default
    private double discountPercentage = 0.0;
    @Builder.Default
    private double discountAmount = 0.0;

    @Builder.Default
    private double taxPercentage = 0.0;
    @Builder.Default
    private double taxAmount = 0.0;

    // Financial totals
    private double totalAmount;
    @Builder.Default
    private double paidAmount = 0.0;
    private double balanceAmount;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.ISSUED;

    private String issueDate; // YYYY-MM-DD
    private String dueDate;   // YYYY-MM-DD

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
