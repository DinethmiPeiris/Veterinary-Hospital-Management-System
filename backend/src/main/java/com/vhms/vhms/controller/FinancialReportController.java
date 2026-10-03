package com.vhms.vhms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.dto.ApiResponse;
import com.vhms.vhms.dto.report.DoctorWorkloadResponse;
import com.vhms.vhms.dto.report.FinancialSummaryResponse;
import com.vhms.vhms.service.FinancialReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FinancialReportController {

    private final FinancialReportService financialReportService;

    // US 4.25: Admin financial reports
    @GetMapping("/financial")
    public ResponseEntity<ApiResponse<FinancialSummaryResponse>> getFinancialSummary() {
        return ResponseEntity.ok(ApiResponse.ok(financialReportService.generateFinancialSummary()));
    }

    // US 4.34: Doctor workload report
    @GetMapping("/doctor-workload/{doctorId}")
    public ResponseEntity<ApiResponse<DoctorWorkloadResponse>> getDoctorWorkload(
            @PathVariable String doctorId,
            @RequestParam(required = false) String doctorName,
            @RequestParam(required = false) String specialization) {
        return ResponseEntity.ok(ApiResponse.ok(financialReportService.getDoctorWorkload(doctorId, doctorName, specialization)));
    }
}
