package com.vhms.vhms.controller;

import com.vhms.vhms.dto.ConsultationResponseDTO;
import com.vhms.vhms.model.Consultation;
import com.vhms.vhms.repository.ConsultationRepository;
import com.vhms.vhms.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final ConsultationRepository consultationRepository;
    private final MedicalRecordService medicalRecordService;

    @GetMapping("/consultations")
    public ResponseEntity<List<ConsultationResponseDTO>> getAllConsultations() {
        List<ConsultationResponseDTO> result = consultationRepository.findAll().stream()
                .map(this::mapToConsultationDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<java.util.Map<String, Object>> getHospitalStats() {
        List<Consultation> consultations = consultationRepository.findAll();
        
        long totalConsultations = consultations.size();
        long completedConsultations = consultations.stream()
                .filter(c -> com.vhms.vhms.model.ConsultationStatus.COMPLETED.equals(c.getStatus()))
                .count();
                
        // Count common diagnoses
        java.util.Map<String, Long> commonDiagnoses = consultations.stream()
                .filter(c -> c.getDiagnosis() != null && !c.getDiagnosis().isBlank())
                .collect(Collectors.groupingBy(Consultation::getDiagnosis, Collectors.counting()));
                
        // Sort and limit to top 5
        java.util.Map<String, Long> topDiagnoses = commonDiagnoses.entrySet().stream()
                .sorted(java.util.Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(
                        java.util.Map.Entry::getKey, 
                        java.util.Map.Entry::getValue, 
                        (e1, e2) -> e1, 
                        java.util.LinkedHashMap::new));

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalConsultations", totalConsultations);
        stats.put("completedConsultations", completedConsultations);
        stats.put("topDiagnoses", topDiagnoses);
        
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/medical-records/pet/{petId}/documents/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String petId, @PathVariable String documentId) {
        medicalRecordService.deleteDocument(petId, documentId);
        return ResponseEntity.noContent().build();
    }

    private ConsultationResponseDTO mapToConsultationDTO(Consultation consultation) {
        ConsultationResponseDTO dto = new ConsultationResponseDTO();
        dto.setId(consultation.getId());
        dto.setMedicalRecordId(consultation.getMedicalRecordId());
        dto.setAppointmentId(consultation.getAppointmentId());
        dto.setPetId(consultation.getPetId());
        dto.setDoctorId(consultation.getDoctorId());
        dto.setPetName(consultation.getPetName());
        dto.setOwnerName(consultation.getOwnerName());
        dto.setDoctorName(consultation.getDoctorName());
        dto.setConsultationDate(consultation.getConsultationDate());
        dto.setStatus(consultation.getStatus());
        dto.setDiagnosis(consultation.getDiagnosis());
        dto.setTreatmentPlan(consultation.getTreatmentPlan());
        return dto;
    }
}
