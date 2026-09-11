package com.vhms.vhms.controller;

import com.vhms.vhms.dto.ConsultationRequestDTO;
import com.vhms.vhms.dto.ConsultationResponseDTO;
import com.vhms.vhms.dto.StatusUpdateDTO;
import com.vhms.vhms.service.ConsultationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/consultations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For development
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping("/start")
    public ResponseEntity<ConsultationResponseDTO> startConsultation(
            @RequestParam String appointmentId,
            @RequestParam String doctorId) {
        return new ResponseEntity<>(consultationService.startConsultation(appointmentId, doctorId), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsultationResponseDTO> getConsultation(@PathVariable String id) {
        return ResponseEntity.ok(consultationService.getConsultation(id));
    }

    @GetMapping("/by-appointment/{appointmentId}")
    public ResponseEntity<ConsultationResponseDTO> getByAppointment(@PathVariable String appointmentId) {
        return ResponseEntity.ok(consultationService.getConsultationByAppointmentId(appointmentId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConsultationResponseDTO> updateConsultation(
            @PathVariable String id,
            @RequestBody ConsultationRequestDTO request) {
        return ResponseEntity.ok(consultationService.updateConsultation(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ConsultationResponseDTO> updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateDTO statusUpdate) {
        return ResponseEntity.ok(consultationService.updateStatus(id, statusUpdate));
    }
}
