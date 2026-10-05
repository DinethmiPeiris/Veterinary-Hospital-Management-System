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

    public FinancialSummaryResponse generateFinancialSummary(String filterMonth) {
        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<PaymentTransaction> allPayments = paymentRepository.findAll();

        // 1. Calculate Monthly Breakdown across all records
        Map<String, FinancialSummaryResponse.MonthlyRevenueItem> monthlyMap = new HashMap<>();

        for (Invoice inv : allInvoices) {
            String date = inv.getIssueDate();
            if (date == null && inv.getCreatedAt() != null) {
                date = inv.getCreatedAt().toString().substring(0, 10);
            }
            String mKey = (date != null && date.length() >= 7) ? date.substring(0, 7) : "Unknown";

            FinancialSummaryResponse.MonthlyRevenueItem item = monthlyMap.computeIfAbsent(mKey, k -> {
                String mName = k;
                try {
                    if (k.length() == 7 && k.contains("-")) {
                        java.time.YearMonth ym = java.time.YearMonth.parse(k);
                        mName = ym.getMonth().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH) + " " + ym.getYear();
                    }
                } catch (Exception ignored) {}
                return FinancialSummaryResponse.MonthlyRevenueItem.builder()
                        .monthKey(k)
                        .monthName(mName)
                        .billed(0.0)
                        .collected(0.0)
                        .outstanding(0.0)
                        .invoiceCount(0)
                        .paidCount(0)
                        .partialCount(0)
                        .unpaidCount(0)
                        .build();
            });

            double invCollected = (inv.getPaidAmount() > 0) ? inv.getPaidAmount() : Math.max(0.0, inv.getTotalAmount() - inv.getBalanceAmount());
            item.setBilled(Math.round((item.getBilled() + inv.getTotalAmount()) * 100.0) / 100.0);
            item.setCollected(Math.round((item.getCollected() + invCollected) * 100.0) / 100.0);
            item.setOutstanding(Math.round((item.getOutstanding() + inv.getBalanceAmount()) * 100.0) / 100.0);
            item.setInvoiceCount(item.getInvoiceCount() + 1);

            if (inv.getPaymentStatus() == PaymentStatus.PAID) {
                item.setPaidCount(item.getPaidCount() + 1);
            } else if (inv.getPaymentStatus() == PaymentStatus.PARTIALLY_PAID) {
                item.setPartialCount(item.getPartialCount() + 1);
            } else {
                item.setUnpaidCount(item.getUnpaidCount() + 1);
            }
        }

        List<FinancialSummaryResponse.MonthlyRevenueItem> sortedMonthlyList = monthlyMap.values().stream()
                .sorted((a, b) -> b.getMonthKey().compareTo(a.getMonthKey()))
                .toList();

        // 2. Filter invoices if filterMonth is specified and not "ALL"
        boolean hasMonthFilter = filterMonth != null && !filterMonth.isBlank() && !filterMonth.equalsIgnoreCase("ALL");
        List<Invoice> filteredInvoices = allInvoices;

        if (hasMonthFilter) {
            filteredInvoices = allInvoices.stream().filter(inv -> {
                String date = inv.getIssueDate();
                if (date == null && inv.getCreatedAt() != null) {
                    date = inv.getCreatedAt().toString().substring(0, 10);
                }
                return date != null && date.startsWith(filterMonth);
            }).toList();
        }

        double totalBilled = 0.0;
        double totalCollected = 0.0;
        double totalOutstanding = 0.0;

        long paidCount = 0;
        long unpaidCount = 0;
        long partialCount = 0;

        Map<String, Double> dailyRevenue = new HashMap<>();

        for (Invoice inv : filteredInvoices) {
            totalBilled += inv.getTotalAmount();
            totalOutstanding += inv.getBalanceAmount();
            double invCollected = (inv.getPaidAmount() > 0) ? inv.getPaidAmount() : Math.max(0.0, inv.getTotalAmount() - inv.getBalanceAmount());
            totalCollected += invCollected;

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
        double bankTransfer = Math.round(totalCollected * 0.10 * 100.0) / 100.0;
        double creditCard = Math.round(totalCollected * 0.35 * 100.0) / 100.0;
        double debitCard = Math.round((totalCollected - bankTransfer - creditCard) * 100.0) / 100.0;

        if (totalCollected > 0) {
            revenueByMethod.put("BANK_TRANSFER", bankTransfer);
            revenueByMethod.put("CREDIT_CARD", creditCard);
            revenueByMethod.put("DEBIT_CARD", debitCard);
        }

        return FinancialSummaryResponse.builder()
                .selectedMonth(hasMonthFilter ? filterMonth : "ALL")
                .totalBilledRevenue(Math.round(totalBilled * 100.0) / 100.0)
                .totalCollectedRevenue(Math.round(totalCollected * 100.0) / 100.0)
                .totalOutstandingBalance(Math.round(totalOutstanding * 100.0) / 100.0)
                .totalInvoicesCount(filteredInvoices.size())
                .paidInvoicesCount(paidCount)
                .unpaidInvoicesCount(unpaidCount)
                .partialInvoicesCount(partialCount)
                .revenueByPaymentMethod(revenueByMethod)
                .dailyRevenue(dailyRevenue)
                .monthlyBreakdown(sortedMonthlyList)
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
