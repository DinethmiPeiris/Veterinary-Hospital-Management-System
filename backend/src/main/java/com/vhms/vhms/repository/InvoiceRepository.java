package com.vhms.vhms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.Invoice;
import com.vhms.vhms.model.PaymentStatus;

@Repository
public interface InvoiceRepository extends MongoRepository<Invoice, String> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByInvoiceNumberStartingWith(String prefix);

    Optional<Invoice> findByAppointmentId(String appointmentId);

    List<Invoice> findByOwnerIdOrderByCreatedAtDesc(String ownerId);

    List<Invoice> findByDoctorId(String doctorId);

    List<Invoice> findByPaymentStatus(PaymentStatus paymentStatus);

    List<Invoice> findByIssueDateBetween(String startDate, String endDate);

    long countByPaymentStatus(PaymentStatus paymentStatus);
}
