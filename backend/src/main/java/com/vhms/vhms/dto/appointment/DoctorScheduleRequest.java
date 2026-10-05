package com.vhms.vhms.dto.appointment;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorScheduleRequest {

    @NotBlank(message = "Doctor ID is required")
    private String doctorId;

    @NotBlank(message = "Doctor Name is required")
    private String doctorName;

    private String doctorSpecialization;

    @NotBlank(message = "Day of week is required (e.g. MONDAY, TUESDAY)")
    private String dayOfWeek;

    @NotBlank(message = "Shift start time is required (e.g. 08:30)")
    private String shiftStartTime;

    @NotBlank(message = "Shift end time is required (e.g. 16:30)")
    private String shiftEndTime;

    @Builder.Default
    private Integer slotDurationMinutes = 30;

    @Builder.Default
    private Integer maxCapacityPerSlot = 1;

    @Builder.Default
    private List<String> blockedDates = new ArrayList<>();

    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private Boolean isActive = true;
}
