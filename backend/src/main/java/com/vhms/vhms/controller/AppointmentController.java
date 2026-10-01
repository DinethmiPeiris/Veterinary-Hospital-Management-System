package com.vhms.vhms.controller;

import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable String id) {
        Optional<Appointment> appointment = appointmentRepository.findById(id);
        return appointment.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByOwner(@PathVariable String ownerId) {
        List<Appointment> list = appointmentRepository.findByPetOwnerId(ownerId);
        if (list.isEmpty()) {
            list = appointmentRepository.findByPetOwnerEmail(ownerId);
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctor(@PathVariable String doctorId) {
        List<Appointment> list = appointmentRepository.findByDoctorId(doctorId);
        if (list.isEmpty()) {
            list = appointmentRepository.findByDoctorEmail(doctorId);
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        if (appointment.getId() != null) {
            if (appointment.getId().isEmpty() || appointmentRepository.existsById(appointment.getId())) {
                appointment.setId(null); // Let MongoDB assign a new unique ID
            }
        }
        if (appointment.getCreatedAt() == null) {
            appointment.setCreatedAt(LocalDateTime.now());
        }
        if (appointment.getStatus() == null || appointment.getStatus().isEmpty()) {
            appointment.setStatus("PENDING");
        }
        Appointment saved = appointmentRepository.save(appointment);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable String id, @RequestBody Appointment details) {
        Optional<Appointment> optional = appointmentRepository.findById(id);
        if (optional.isPresent()) {
            Appointment appt = optional.get();
            if (details.getStatus() != null)
                appt.setStatus(details.getStatus());
            if (details.getDoctorNotes() != null)
                appt.setDoctorNotes(details.getDoctorNotes());
            if (details.getPrescriptions() != null)
                appt.setPrescriptions(details.getPrescriptions());
            if (details.getDiagnosis() != null)
                appt.setDiagnosis(details.getDiagnosis());
            if (details.getDate() != null)
                appt.setDate(details.getDate());
            if (details.getTimeSlot() != null)
                appt.setTimeSlot(details.getTimeSlot());
            if (details.getReason() != null)
                appt.setReason(details.getReason());
            Appointment updated = appointmentRepository.save(appt);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable String id) {
        if (appointmentRepository.existsById(id)) {
            appointmentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
