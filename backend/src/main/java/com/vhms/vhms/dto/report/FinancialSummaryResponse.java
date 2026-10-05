package com.vhms.vhms.dto.report;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryResponse {

    private String selectedMonth; // e.g. "ALL" or "2026-10"

    private double totalBilledRevenue;
    private double totalCollectedRevenue;
    private double totalOutstandingBalance;
    private long totalInvoicesCount;
    private long paidInvoicesCount;
    private long unpaidInvoicesCount;
    private long partialInvoicesCount;

    // Breakdown by payment method: CASH, CREDIT_CARD, etc.
    private Map<String, Double> revenueByPaymentMethod;

    // Daily breakdown for charts
    private Map<String, Double> dailyRevenue;

    // Monthly breakdown list for monthly reports
    private List<MonthlyRevenueItem> monthlyBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueItem {
        private String monthKey;    // e.g. "2026-10"
        private String monthName;   // e.g. "October 2026"
        private double billed;
        private double collected;
        private double outstanding;
        private long invoiceCount;
        private long paidCount;
        private long partialCount;
        private long unpaidCount;
    }
}
