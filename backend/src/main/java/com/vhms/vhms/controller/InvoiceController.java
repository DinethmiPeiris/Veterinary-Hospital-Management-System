package com.vhms.vhms.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.dto.ApiResponse;
import com.vhms.vhms.dto.billing.AddDoctorServiceChargeRequest;
import com.vhms.vhms.dto.billing.AddHospitalizationChargeRequest;
import com.vhms.vhms.dto.billing.CreateInvoiceRequest;
import com.vhms.vhms.model.Invoice;
import com.vhms.vhms.service.InvoiceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    // US 4.23: Admin generate invoice
    @PostMapping
    public ResponseEntity<ApiResponse<Invoice>> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        Invoice created = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Invoice generated successfully.", created));
    }

    // US 4.7: Get invoice by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Invoice>> getInvoiceById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoiceById(id)));
    }

    @GetMapping("/number/{number}")
    public ResponseEntity<ApiResponse<Invoice>> getInvoiceByNumber(@PathVariable String number) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoiceByNumber(number)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Invoice>>> getAllInvoices() {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getAllInvoices()));
    }

    // US 4.7: Pet owner view their invoices
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoicesByOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoicesByOwner(ownerId)));
    }

    // US 4.32: Doctor view consultation charges
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoicesByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoicesByDoctor(doctorId)));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<Invoice>> getInvoiceByAppointmentId(@PathVariable String appointmentId) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoiceByAppointmentId(appointmentId)));
    }

    // US 4.27: Admin add hospitalization charges
    @PostMapping("/{id}/hospitalization")
    public ResponseEntity<ApiResponse<Invoice>> addHospitalizationCharges(
            @PathVariable String id,
            @Valid @RequestBody AddHospitalizationChargeRequest request) {
        Invoice updated = invoiceService.addHospitalizationCharges(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Hospitalization charges added to invoice.", updated));
    }

    // US 4.33: Doctor add service/treatment charges
    @PostMapping("/{id}/doctor-charges")
    public ResponseEntity<ApiResponse<Invoice>> addDoctorCharges(
            @PathVariable String id,
            @Valid @RequestBody AddDoctorServiceChargeRequest request) {
        Invoice updated = invoiceService.addDoctorServiceCharges(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Service charges added to invoice.", updated));
    }
}
