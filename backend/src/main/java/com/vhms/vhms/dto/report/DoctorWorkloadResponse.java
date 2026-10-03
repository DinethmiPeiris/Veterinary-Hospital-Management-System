package com.vhms.vhms.dto.report;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorWorkloadResponse {

    private String doctorId;
    private String doctorName;
    private String doctorSpecialization;

    private long totalAssignedAppointments;
    private long completedAppointments;
    private long pendingAppointments;
    private long cancelledAppointments;

    private Double averageRating;
    private long totalReviewsCount;

    private List<String> upcomingDates;
}
