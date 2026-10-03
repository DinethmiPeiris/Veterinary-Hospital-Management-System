package com.vhms.vhms.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.billing.AddDoctorServiceChargeRequest;
import com.vhms.vhms.dto.billing.AddHospitalizationChargeRequest;
import com.vhms.vhms.dto.billing.CreateInvoiceRequest;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.Invoice;
import com.vhms.vhms.model.InvoiceItem;
import com.vhms.vhms.model.InvoiceStatus;
import com.vhms.vhms.model.ItemType;
import com.vhms.vhms.model.NotificationType;
import com.vhms.vhms.model.PaymentStatus;
import com.vhms.vhms.repository.AppointmentRepository;
import com.vhms.vhms.repository.InvoiceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    public Invoice createInvoice(CreateInvoiceRequest request) {
        String invoiceNumber = request.getInvoiceNumber();
        if (invoiceNumber == null || invoiceNumber.isBlank() || invoiceNumber.contains("CCF") || invoiceNumber.matches("INV-\\d{8}-.*")) {
            String sourceNum = request.getAppointmentNumber();
            if (sourceNum == null || sourceNum.isBlank()) {
                if (request.getAppointmentId() != null && !request.getAppointmentId().isBlank()) {
                    var apptOpt = appointmentRepository.findById(request.getAppointmentId());
                    if (apptOpt.isPresent() && apptOpt.get().getAppointmentNumber() != null && !apptOpt.get().getAppointmentNumber().isBlank()) {
                        sourceNum = apptOpt.get().getAppointmentNumber();
                    }
                }
            }
            if (sourceNum != null && !sourceNum.isBlank()) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)$").matcher(sourceNum);
                if (m.find() && m.group(1).length() <= 6) {
                    try {
                        invoiceNumber = String.format("INV-%04d", Integer.parseInt(m.group(1)));
                    } catch (Exception ignored) {
                        invoiceNumber = sourceNum.replace("APT-", "INV-").replace("APT", "INV");
                    }
                } else {
                    invoiceNumber = sourceNum.replace("APT-", "INV-").replace("APT", "INV");
                }
            }
        }
        if (invoiceNumber == null || invoiceNumber.isBlank()) {
            invoiceNumber = generateInvoiceNumber();
        }

        // Calculate line items total
        double subtotal = 0.0;
        List<InvoiceItem> items = request.getItems() != null ? new ArrayList<>(request.getItems()) : new ArrayList<>();
        for (InvoiceItem item : items) {
            item.setTotalPrice(item.getQuantity() * item.getUnitPrice());
            subtotal += item.getTotalPrice();
        }

        double hospitalizationCharges = request.getHospitalizationCharges();
        subtotal += hospitalizationCharges;

        double discountPct = request.getDiscountPercentage();
        double discountAmount = (subtotal * discountPct) / 100.0;

        double afterDiscount = subtotal - discountAmount;

        double taxPct = request.getTaxPercentage();
        double taxAmount = (afterDiscount * taxPct) / 100.0;

        double totalAmount = afterDiscount + taxAmount;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .appointmentId(request.getAppointmentId())
                .appointmentNumber(request.getAppointmentNumber())
                .petId(request.getPetId())
                .petName(request.getPetName())
                .petSpecies(request.getPetSpecies())
                .ownerId(request.getOwnerId())
                .ownerName(request.getOwnerName())
                .ownerEmail(request.getOwnerEmail())
                .ownerPhone(request.getOwnerPhone())
                .doctorId(request.getDoctorId())
                .doctorName(request.getDoctorName())
                .items(items)
                .hospitalizationCharges(hospitalizationCharges)
                .hospitalizationDetails(request.getHospitalizationDetails())
                .subtotal(Math.round(subtotal * 100.0) / 100.0)
                .discountPercentage(discountPct)
                .discountAmount(Math.round(discountAmount * 100.0) / 100.0)
                .taxPercentage(taxPct)
                .taxAmount(Math.round(taxAmount * 100.0) / 100.0)
                .totalAmount(Math.round(totalAmount * 100.0) / 100.0)
                .paidAmount(0.0)
                .balanceAmount(Math.round(totalAmount * 100.0) / 100.0)
                .paymentStatus(PaymentStatus.UNPAID)
                .status(InvoiceStatus.ISSUED)
                .issueDate(LocalDate.now().toString())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(7).toString())
                .notes(request.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Invoice saved = invoiceRepository.save(invoice);

        // If linked to an appointment, mark appointment as billed
        if (request.getAppointmentId() != null && !request.getAppointmentId().isBlank()) {
            appointmentRepository.findById(request.getAppointmentId()).ifPresent(appt -> {
                appt.setBilled(true);
                appt.setInvoiceId(saved.getId());
                appointmentRepository.save(appt);
            });
        } else if (request.getAppointmentNumber() != null && !request.getAppointmentNumber().isBlank()) {
            appointmentRepository.findByAppointmentNumber(request.getAppointmentNumber()).ifPresent(appt -> {
                appt.setBilled(true);
                appt.setInvoiceId(saved.getId());
                appointmentRepository.save(appt);
            });
        }

        // Notify Pet Owner about new invoice
        notificationService.sendNotification(
                saved.getOwnerId(),
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.INVOICE_GENERATED,
                "New Invoice Issued",
                "Invoice #" + saved.getInvoiceNumber() + " for Rs. " + saved.getTotalAmount()
                        + " has been issued for " + saved.getPetName() + ". Due by: " + saved.getDueDate(),
                "INVOICE",
                saved.getId()
        );

        return saved;
    }

    private void normalizeInvoiceNumber(Invoice inv) {
        if (inv == null) return;
        try {
            if (inv.getAppointmentNumber() != null && !inv.getAppointmentNumber().isBlank()) {
                String apptNum = inv.getAppointmentNumber();
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)$").matcher(apptNum);
                if (m.find() && m.group(1).length() <= 6) {
                    try {
                        inv.setInvoiceNumber(String.format("INV-%04d", Integer.parseInt(m.group(1))));
                        return;
                    } catch (Exception ignored) {}
                }
                inv.setInvoiceNumber(apptNum.replace("APT-", "INV-").replace("APT", "INV"));
                return;
            }
            if (inv.getInvoiceNumber() != null && inv.getInvoiceNumber().contains("-")) {
                String[] parts = inv.getInvoiceNumber().split("-");
                String lastPart = parts[parts.length - 1];
                try {
                    if (lastPart.length() <= 6) {
                        int seq = Integer.parseInt(lastPart);
                        inv.setInvoiceNumber(String.format("INV-%04d", seq));
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.warn("Error normalizing invoice number: {}", e.getMessage());
        }
    }

    public Invoice getInvoiceById(String id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + id));
        normalizeInvoiceNumber(invoice);
        return invoice;
    }

    public Invoice getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));
    }

    public List<Invoice> getAllInvoices() {
        List<Invoice> list = invoiceRepository.findAll();
        list.forEach(this::normalizeInvoiceNumber);
        return list;
    }

    public List<Invoice> getInvoicesByOwner(String ownerId) {
        List<Invoice> list = invoiceRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        list.forEach(this::normalizeInvoiceNumber);
        return list;
    }

    public List<Invoice> getInvoicesByDoctor(String doctorId) {
        List<Invoice> list = invoiceRepository.findByDoctorId(doctorId);
        list.forEach(this::normalizeInvoiceNumber);
        return list;
    }

    public Invoice getInvoiceByAppointmentId(String appointmentId) {
        return invoiceRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for Appointment ID: " + appointmentId));
    }

    // US 4.27: Add hospitalization charges
    public Invoice addHospitalizationCharges(String invoiceId, AddHospitalizationChargeRequest request) {
        Invoice invoice = getInvoiceById(invoiceId);
        if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
            throw new InvalidOperationException("Cannot modify an already paid invoice.");
        }

        invoice.setHospitalizationCharges(request.getHospitalizationCharges());
        invoice.setHospitalizationDetails(request.getHospitalizationDetails());
        recalculateTotals(invoice);
        invoice.setUpdatedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    // US 4.33: Doctor adds treatment / service charges
    public Invoice addDoctorServiceCharges(String invoiceId, AddDoctorServiceChargeRequest request) {
        Invoice invoice = getInvoiceById(invoiceId);
        if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
            throw new InvalidOperationException("Cannot modify an already paid invoice.");
        }

        if (request.getItems() != null) {
            for (InvoiceItem item : request.getItems()) {
                item.setTotalPrice(item.getQuantity() * item.getUnitPrice());
                invoice.getItems().add(item);
            }
        }

        recalculateTotals(invoice);
        invoice.setUpdatedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    public void updatePaymentProgress(String invoiceId, double paymentAmount) {
        Invoice invoice = getInvoiceById(invoiceId);
        double newPaid = invoice.getPaidAmount() + paymentAmount;
        double newBalance = invoice.getTotalAmount() - newPaid;

        invoice.setPaidAmount(Math.round(newPaid * 100.0) / 100.0);
        invoice.setBalanceAmount(Math.max(0.0, Math.round(newBalance * 100.0) / 100.0));

        if (invoice.getBalanceAmount() <= 0.0) {
            invoice.setPaymentStatus(PaymentStatus.PAID);
        } else {
            invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        }

        invoice.setUpdatedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);
    }

    private void recalculateTotals(Invoice invoice) {
        double subtotal = 0.0;
        if (invoice.getItems() != null) {
            for (InvoiceItem item : invoice.getItems()) {
                subtotal += (item.getQuantity() * item.getUnitPrice());
            }
        }
        subtotal += invoice.getHospitalizationCharges();

        double discountAmount = (subtotal * invoice.getDiscountPercentage()) / 100.0;
        double afterDiscount = subtotal - discountAmount;
        double taxAmount = (afterDiscount * invoice.getTaxPercentage()) / 100.0;
        double total = afterDiscount + taxAmount;

        invoice.setSubtotal(Math.round(subtotal * 100.0) / 100.0);
        invoice.setDiscountAmount(Math.round(discountAmount * 100.0) / 100.0);
        invoice.setTaxAmount(Math.round(taxAmount * 100.0) / 100.0);
        invoice.setTotalAmount(Math.round(total * 100.0) / 100.0);
        invoice.setBalanceAmount(Math.max(0.0, Math.round((total - invoice.getPaidAmount()) * 100.0) / 100.0));
    }

    private synchronized String generateInvoiceNumber() {
        String prefix = "INV-";
        List<Invoice> existing = invoiceRepository.findAll();
        java.util.Set<Integer> usedSeqs = new java.util.HashSet<>();
        for (Invoice inv : existing) {
            String num = inv.getInvoiceNumber();
            if (num != null) {
                String digits = num.replaceAll("[^0-9]", "");
                if (!digits.isEmpty()) {
                    try {
                        usedSeqs.add(Integer.parseInt(digits));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        int seq = 1;
        while (usedSeqs.contains(seq)) {
            seq++;
        }
        return String.format("INV-%04d", seq);
    }
}
