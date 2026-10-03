package com.vhms.vhms.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.payment.ProcessPaymentRequest;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Invoice;
import com.vhms.vhms.model.NotificationType;
import com.vhms.vhms.model.PaymentStatus;
import com.vhms.vhms.model.PaymentTransaction;
import com.vhms.vhms.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceService invoiceService;
    private final NotificationService notificationService;

    public PaymentTransaction processPayment(ProcessPaymentRequest request) {
        Invoice invoice = invoiceService.getInvoiceById(request.getInvoiceId());

        if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
            throw new InvalidOperationException("Invoice #" + invoice.getInvoiceNumber() + " is already fully paid.");
        }

        if (request.getAmountPaid() > invoice.getBalanceAmount() + 0.01) {
            throw new InvalidOperationException("Payment amount (Rs. " + request.getAmountPaid()
                    + ") exceeds outstanding balance (Rs. " + invoice.getBalanceAmount() + ").");
        }

        String transactionNumber = generateTransactionNumber();
        String receiptNumber = generateReceiptNumber(invoice);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionNumber(transactionNumber)
                .receiptNumber(receiptNumber)
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .ownerId(invoice.getOwnerId())
                .ownerName(invoice.getOwnerName())
                .amountPaid(Math.round(request.getAmountPaid() * 100.0) / 100.0)
                .paymentMethod(request.getPaymentMethod())
                .transactionReference(request.getTransactionReference())
                .cashierId(request.getCashierId())
                .cashierName(request.getCashierName())
                .paymentStatus(PaymentStatus.SUCCESS)
                .notes(request.getNotes())
                .paymentDate(LocalDateTime.now())
                .build();

        PaymentTransaction saved = paymentRepository.save(transaction);

        // Update invoice balance
        invoiceService.updatePaymentProgress(invoice.getId(), saved.getAmountPaid());

        // Notify Pet Owner with Receipt reference
        notificationService.sendNotification(
                invoice.getOwnerId(),
                "PET_OWNER",
                invoice.getOwnerEmail(),
                invoice.getOwnerPhone(),
                NotificationType.PAYMENT_RECEIVED,
                "Payment Received - Receipt #" + saved.getReceiptNumber(),
                "Payment of Rs. " + saved.getAmountPaid() + " was successfully recorded for Invoice #"
                        + invoice.getInvoiceNumber() + ". Receipt #" + saved.getReceiptNumber() + " is available for download.",
                "PAYMENT",
                saved.getId()
        );

        return saved;
    }

    private void normalizeReceipt(PaymentTransaction pay) {
        if (pay == null) return;
        if (pay.getInvoiceNumber() != null && !pay.getInvoiceNumber().isBlank()) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)$").matcher(pay.getInvoiceNumber());
            if (m.find() && m.group(1).length() <= 6) {
                try {
                    pay.setReceiptNumber(String.format("REC-%04d", Integer.parseInt(m.group(1))));
                    return;
                } catch (Exception ignored) {}
            }
            pay.setReceiptNumber(pay.getInvoiceNumber().replace("INV-", "REC-").replace("INV", "REC"));
            return;
        }
        if (pay.getReceiptNumber() != null && pay.getReceiptNumber().contains("-")) {
            String[] parts = pay.getReceiptNumber().split("-");
            String lastPart = parts[parts.length - 1];
            try {
                if (lastPart.length() <= 6) {
                    pay.setReceiptNumber(String.format("REC-%04d", Integer.parseInt(lastPart)));
                }
            } catch (Exception ignored) {}
        }
    }

    public PaymentTransaction getPaymentById(String id) {
        PaymentTransaction pay = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found with ID: " + id));
        normalizeReceipt(pay);
        return pay;
    }

    public PaymentTransaction getPaymentByReceiptNumber(String receiptNumber) {
        PaymentTransaction pay = paymentRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found with number: " + receiptNumber));
        normalizeReceipt(pay);
        return pay;
    }

    public List<PaymentTransaction> getAllPayments() {
        List<PaymentTransaction> list = paymentRepository.findAll();
        list.forEach(this::normalizeReceipt);
        return list;
    }

    public List<PaymentTransaction> getPaymentsByOwner(String ownerId) {
        List<PaymentTransaction> list = paymentRepository.findByOwnerIdOrderByPaymentDateDesc(ownerId);
        list.forEach(this::normalizeReceipt);
        return list;
    }

    public List<PaymentTransaction> getPaymentsByInvoice(String invoiceId) {
        List<PaymentTransaction> list = paymentRepository.findByInvoiceIdOrderByPaymentDateDesc(invoiceId);
        list.forEach(this::normalizeReceipt);
        return list;
    }

    private String generateTransactionNumber() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "TXN-" + datePrefix + "-" + randomSuffix;
    }

    private String generateReceiptNumber(Invoice invoice) {
        if (invoice != null && invoice.getInvoiceNumber() != null && !invoice.getInvoiceNumber().isBlank()) {
            String invNum = invoice.getInvoiceNumber();
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)$").matcher(invNum);
            if (m.find() && m.group(1).length() <= 6) {
                try {
                    return String.format("REC-%04d", Integer.parseInt(m.group(1)));
                } catch (Exception ignored) {}
            }
            return invNum.replace("INV-", "REC-").replace("INV", "REC").replace("APT-", "REC-");
        }
        if (invoice != null && invoice.getAppointmentNumber() != null && !invoice.getAppointmentNumber().isBlank()) {
            String apptNum = invoice.getAppointmentNumber();
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)$").matcher(apptNum);
            if (m.find() && m.group(1).length() <= 6) {
                try {
                    return String.format("REC-%04d", Integer.parseInt(m.group(1)));
                } catch (Exception ignored) {}
            }
            return apptNum.replace("APT-", "REC-").replace("APT", "REC");
        }
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "REC-" + datePrefix + "-" + randomSuffix;
    }
}
