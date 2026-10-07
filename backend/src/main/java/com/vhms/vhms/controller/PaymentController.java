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
import com.vhms.vhms.dto.payment.ProcessPaymentRequest;
import com.vhms.vhms.model.PaymentTransaction;
import com.vhms.vhms.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // US 4.8 & US 4.24: Process / record payment
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentTransaction>> processPayment(@Valid @RequestBody ProcessPaymentRequest request) {
        PaymentTransaction transaction = paymentService.processPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Payment processed successfully. Receipt #" + transaction.getReceiptNumber(), transaction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentTransaction>> getPaymentById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentById(id)));
    }

    // US 4.10: Get payment receipt by receipt number
    @GetMapping("/receipt/{receiptNumber}")
    public ResponseEntity<ApiResponse<PaymentTransaction>> getPaymentByReceiptNumber(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentByReceiptNumber(receiptNumber)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentTransaction>>> getAllPayments() {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getAllPayments()));
    }

    // US 4.9: Pet owner view payment history
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<PaymentTransaction>>> getPaymentsByOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentsByOwner(ownerId)));
    }

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<List<PaymentTransaction>>> getPaymentsByInvoice(@PathVariable String invoiceId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentsByInvoice(invoiceId)));
    }
}
