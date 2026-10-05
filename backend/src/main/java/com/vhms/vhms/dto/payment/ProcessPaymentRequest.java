package com.vhms.vhms.dto.payment;

import com.vhms.vhms.model.PaymentMethod;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPaymentRequest {

    @NotBlank(message = "Invoice ID is required")
    private String invoiceId;

    @Positive(message = "Payment amount must be greater than 0")
    private double amountPaid;

    @NotNull(message = "Payment Method is required")
    private PaymentMethod paymentMethod; // CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, ONLINE_GATEWAY

    private String transactionReference;
    private String cashierId;
    private String cashierName;
    private String notes;
}
