package com.vhms.vhms.dto.report;

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
}
