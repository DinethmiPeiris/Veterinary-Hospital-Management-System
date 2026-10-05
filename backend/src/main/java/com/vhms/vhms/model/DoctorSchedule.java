package com.vhms.vhms.model;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "doctor_schedules")
@CompoundIndex(name = "doctor_day_idx", def = "{'doctorId': 1, 'dayOfWeek': 1}", unique = false)
public class DoctorSchedule {

    @Id
    private String id;

    private String doctorId;
    private String doctorName;
    private String doctorSpecialization;

    // Day of week: MONDAY, TUESDAY, etc.
    private String dayOfWeek;

    // Shift times in HH:mm format, e.g. "08:30" - "16:30"
    private String shiftStartTime;
    private String shiftEndTime;

    // Slot duration in minutes, default 30
    @Builder.Default
    private int slotDurationMinutes = 30;

    @Builder.Default
    private int maxCapacityPerSlot = 1;

    // List of blocked dates (e.g. YYYY-MM-DD) for leaves/holidays
    @Builder.Default
    private List<String> blockedDates = new ArrayList<>();

    @Builder.Default
    private boolean isActive = true;
}
