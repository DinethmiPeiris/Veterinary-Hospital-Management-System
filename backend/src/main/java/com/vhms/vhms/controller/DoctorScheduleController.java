package com.vhms.vhms.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.dto.ApiResponse;
import com.vhms.vhms.dto.appointment.DoctorScheduleRequest;
import com.vhms.vhms.dto.appointment.TimeSlotResponse;
import com.vhms.vhms.model.DoctorSchedule;
import com.vhms.vhms.service.DoctorScheduleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctor-schedules")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;

    // US 4.13: Save/update schedule
    @PostMapping
    public ResponseEntity<ApiResponse<DoctorSchedule>> saveSchedule(@Valid @RequestBody DoctorScheduleRequest request) {
        DoctorSchedule saved = doctorScheduleService.saveSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Doctor schedule saved successfully.", saved));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<DoctorSchedule>>> getSchedulesByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(ApiResponse.ok(doctorScheduleService.getSchedulesByDoctor(doctorId)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<DoctorSchedule>>> getAllSchedules() {
        return ResponseEntity.ok(ApiResponse.ok(doctorScheduleService.getAllSchedules()));
    }

    // Dynamic slot calculator for booking form
    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getAvailableSlots(
            @RequestParam String doctorId,
            @RequestParam String date) {
        List<TimeSlotResponse> slots = doctorScheduleService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(ApiResponse.ok(slots));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable String id) {
        doctorScheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.ok("Schedule removed successfully.", null));
    }
}
