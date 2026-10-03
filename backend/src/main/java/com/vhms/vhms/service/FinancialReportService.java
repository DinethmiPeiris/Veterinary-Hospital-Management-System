package com.vhms.vhms.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.report.DoctorWorkloadResponse;
import com.vhms.vhms.dto.report.FinancialSummaryResponse;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.AppointmentStatus;
import com.vhms.vhms.model.Invoice;
import com.vhms.vhms.model.PaymentStatus;
import com.vhms.vhms.model.PaymentTransaction;
import com.vhms.vhms.repository.AppointmentRepository;
import com.vhms.vhms.repository.InvoiceRepository;
import com.vhms.vhms.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialReportService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final FeedbackService feedbackService;

    public FinancialSummaryResponse generateFinancialSummary() {
        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<PaymentTransaction> allPayments = paymentRepository.findAll();

        double totalBilled = 0.0;
        double totalCollected = 0.0;
        double totalOutstanding = 0.0;

        long paidCount = 0;
        long unpaidCount = 0;
        long partialCount = 0;

        Map<String, Double> dailyRevenue = new HashMap<>();

        for (Invoice inv : allInvoices) {
            totalBilled += inv.getTotalAmount();
            totalOutstanding += inv.getBalanceAmount();

            if (inv.getPaymentStatus() == PaymentStatus.PAID) {
                paidCount++;
            } else if (inv.getPaymentStatus() == PaymentStatus.PARTIALLY_PAID) {
                partialCount++;
            } else {
                unpaidCount++;
            }

            if (inv.getIssueDate() != null) {
                dailyRevenue.put(inv.getIssueDate(), dailyRevenue.getOrDefault(inv.getIssueDate(), 0.0) + inv.getTotalAmount());
            }
        }

        Map<String, Double> revenueByMethod = new HashMap<>();
        for (PaymentTransaction p : allPayments) {
            totalCollected += p.getAmountPaid();
            String method = (p.getPaymentMethod() != null) ? p.getPaymentMethod().name() : "OTHER";
            revenueByMethod.put(method, revenueByMethod.getOrDefault(method, 0.0) + p.getAmountPaid());
        }

        return FinancialSummaryResponse.builder()
                .totalBilledRevenue(Math.round(totalBilled * 100.0) / 100.0)
                .totalCollectedRevenue(Math.round(totalCollected * 100.0) / 100.0)
                .totalOutstandingBalance(Math.round(totalOutstanding * 100.0) / 100.0)
                .totalInvoicesCount(allInvoices.size())
                .paidInvoicesCount(paidCount)
                .unpaidInvoicesCount(unpaidCount)
                .partialInvoicesCount(partialCount)
                .revenueByPaymentMethod(revenueByMethod)
                .dailyRevenue(dailyRevenue)
                .build();
    }

    public DoctorWorkloadResponse getDoctorWorkload(String doctorId, String doctorName, String specialization) {
        List<Appointment> list = appointmentRepository.findByDoctorIdOrderByAppointmentDateDesc(doctorId)
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.REQUESTED)
                .toList();

        long completed = 0;
        long pending = 0;
        long cancelled = 0;

        for (Appointment a : list) {
            if (a.getStatus() == AppointmentStatus.COMPLETED) {
                completed++;
            } else if (a.getStatus() == AppointmentStatus.CANCELLED || a.getStatus() == AppointmentStatus.REJECTED || a.getStatus() == AppointmentStatus.EXPIRED || a.getStatus() == AppointmentStatus.NO_SHOW) {
                cancelled++;
            } else {
                pending++;
            }
        }

        Double avgRating = feedbackService.getDoctorAverageRating(doctorId);
        long reviewCount = feedbackService.getFeedbackByDoctor(doctorId).size();

        return DoctorWorkloadResponse.builder()
                .doctorId(doctorId)
                .doctorName(doctorName != null ? doctorName : (list.isEmpty() ? "Veterinarian" : list.get(0).getDoctorName()))
                .doctorSpecialization(specialization != null ? specialization : (list.isEmpty() ? "General" : list.get(0).getDoctorSpecialization()))
                .totalAssignedAppointments(list.size())
                .completedAppointments(completed)
                .pendingAppointments(pending)
                .cancelledAppointments(cancelled)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : null)
                .totalReviewsCount(reviewCount)
                .build();
    }
}
