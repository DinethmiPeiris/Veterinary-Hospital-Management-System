package com.vhms.vhms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.PaymentTransaction;

@Repository
public interface PaymentRepository extends MongoRepository<PaymentTransaction, String> {

    Optional<PaymentTransaction> findByTransactionNumber(String transactionNumber);

    Optional<PaymentTransaction> findByReceiptNumber(String receiptNumber);

    List<PaymentTransaction> findByInvoiceIdOrderByPaymentDateDesc(String invoiceId);

    List<PaymentTransaction> findByOwnerIdOrderByPaymentDateDesc(String ownerId);
}
