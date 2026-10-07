package com.vhms.vhms.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.dto.ApiResponse;
import com.vhms.vhms.dto.appointment.CreateAppointmentRequest;
import com.vhms.vhms.dto.appointment.ReassignDoctorRequest;
import com.vhms.vhms.dto.appointment.RescheduleAppointmentRequest;
import com.vhms.vhms.dto.appointment.UpdateAppointmentStatusRequest;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.AppointmentStatus;
import com.vhms.vhms.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/appointments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // US 4.1 / Booking: Create appointment request
    @PostMapping
    public ResponseEntity<ApiResponse<Appointment>> createAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        Appointment created = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Appointment request submitted successfully.", created));
    }

    // US 4.14: Get all appointments with optional status filter
    @GetMapping
    public ResponseEntity<ApiResponse<List<Appointment>>> getAllAppointments(
            @RequestParam(required = false) AppointmentStatus status) {
        List<Appointment> list = (status != null)
                ? appointmentService.getAppointmentsByStatus(status)
                : appointmentService.getAllAppointments();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Appointment>> getAppointmentById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(appointmentService.getAppointmentById(id)));
    }

    @GetMapping("/number/{number}")
    public ResponseEntity<ApiResponse<Appointment>> getAppointmentByNumber(@PathVariable String number) {
        return ResponseEntity.ok(ApiResponse.ok(appointmentService.getAppointmentByNumber(number)));
    }

    // US 4.1 & US 4.6: Pet owner upcoming appointments & history
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getAppointmentsByOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(ApiResponse.ok(appointmentService.getAppointmentsByOwner(ownerId)));
    }

    // US 4.28: Doctor assigned appointments
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getAppointmentsByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(ApiResponse.ok(appointmentService.getAppointmentsByDoctor(doctorId)));
    }

    // US 4.29: Doctor daily agenda
    @GetMapping("/doctor/{doctorId}/daily")
    public ResponseEntity<ApiResponse<List<Appointment>>> getDoctorDailyAgenda(
            @PathVariable String doctorId,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(ApiResponse.ok(appointmentService.getDoctorDailyAgenda(doctorId, date)));
    }

    // US 4.15: Admin approve appointment
    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Appointment>> approveAppointment(@PathVariable String id) {
        Appointment approved = appointmentService.approveAppointment(id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment approved successfully.", approved));
    }

    // US 4.16: Admin reject appointment
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Appointment>> rejectAppointment(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload) {
        String reason = (payload != null) ? payload.get("reason") : "Unable to accommodate";
        Appointment rejected = appointmentService.rejectAppointment(id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rejected.", rejected));
    }

    // US 4.17: Admin reassign doctor
    @PatchMapping("/{id}/reassign")
    public ResponseEntity<ApiResponse<Appointment>> reassignDoctor(
            @PathVariable String id,
            @Valid @RequestBody ReassignDoctorRequest request) {
        Appointment reassigned = appointmentService.reassignDoctor(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Veterinarian reassigned successfully.", reassigned));
    }

    // US 4.18: Admin reschedule appointment
    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<ApiResponse<Appointment>> rescheduleAppointment(
            @PathVariable String id,
            @Valid @RequestBody RescheduleAppointmentRequest request) {
        Appointment rescheduled = appointmentService.rescheduleAppointment(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rescheduled successfully.", rescheduled));
    }

    // US 4.19 & US 4.5: Cancel appointment
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Appointment>> cancelAppointment(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload) {
        String reason = (payload != null) ? payload.get("reason") : "Cancelled by user/admin";
        String cancelledBy = (payload != null) ? payload.get("cancelledBy") : "ADMIN";
        Appointment cancelled = appointmentService.cancelAppointment(id, reason, cancelledBy);
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled.", cancelled));
    }

    // US 4.31: Doctor mark appointment as completed
    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Appointment>> markCompleted(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload) {
        String notes = (payload != null) ? payload.get("doctorNotes") : null;
        Appointment completed = appointmentService.markCompleted(id, notes);
        return ResponseEntity.ok(ApiResponse.ok("Appointment marked as completed.", completed));
    }

    // US 4.21: Admin send manual reminder
    @PostMapping("/{id}/remind")
    public ResponseEntity<ApiResponse<Appointment>> sendReminder(@PathVariable String id) {
        Appointment reminded = appointmentService.sendManualReminder(id);
        return ResponseEntity.ok(ApiResponse.ok("Reminder sent successfully.", reminded));
    }

    // Admin notify Pet Owner to re-book expired appointment
    @PostMapping("/{id}/notify-rebook")
    public ResponseEntity<ApiResponse<Appointment>> sendRebookAlert(@PathVariable String id) {
        Appointment updated = appointmentService.sendRebookAlertToOwner(id);
        return ResponseEntity.ok(ApiResponse.ok("Re-booking notification sent to pet owner.", updated));
    }

    // US 4.20: Generic status update
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Appointment>> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request) {
        Appointment updated = appointmentService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment status updated.", updated));
    }
}
