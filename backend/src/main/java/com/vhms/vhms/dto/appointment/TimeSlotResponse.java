package com.vhms.vhms.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotResponse {

    private String timeSlot;       // "09:00 - 09:30"
    private String startTime;      // "09:00"
    private String endTime;        // "09:30"
    private boolean isAvailable;   // true if not booked
    private String doctorId;
    private String date;
}
