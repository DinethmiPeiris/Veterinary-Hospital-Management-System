package com.vhms.vhms.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
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
@Document(collection = "payment_transactions")
public class PaymentTransaction {

    @Id
    private String id;

    @Indexed(unique = true)
    private String transactionNumber; // e.g. TXN-20260827-001

    @Indexed(unique = true)
    private String receiptNumber;     // e.g. REC-20260827-001 (US 4.10)

    @Indexed
    private String invoiceId;
    private String invoiceNumber;

    @Indexed
    private String ownerId;
    private String ownerName;

    private double amountPaid;
    private PaymentMethod paymentMethod; // CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, ONLINE_GATEWAY
    private String transactionReference; // e.g. Card auth code or bank ref

    private String cashierId;
    private String cashierName;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.SUCCESS;

    private String notes;

    @CreatedDate
    private LocalDateTime paymentDate;
}
