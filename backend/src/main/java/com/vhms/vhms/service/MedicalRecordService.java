package com.vhms.vhms.service;

import com.vhms.vhms.dto.ConsultationResponseDTO;
import com.vhms.vhms.dto.MedicalRecordResponseDTO;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.Consultation;
import com.vhms.vhms.model.MedicalRecord;
import com.vhms.vhms.repository.AppointmentRepository;
import com.vhms.vhms.repository.ConsultationRepository;
import com.vhms.vhms.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final ConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;

    public MedicalRecordResponseDTO getMedicalRecordByPetId(String petId) {
        MedicalRecord record = medicalRecordRepository.findByPetId(petId)
                .orElseGet(() -> createFromAppointments(petId));

        record = normalizeAndPersistSpeciesBreed(record, petId);
        record = fillMissingDemographics(record, petId);

        List<Consultation> consultations = consultationRepository
                .findByPetIdOrderByConsultationDateDesc(petId);

        if (consultations.isEmpty()) {
            consultations = consultationRepository
                    .findByMedicalRecordIdOrderByConsultationDateDesc(record.getId());
        }

        MedicalRecordResponseDTO response = new MedicalRecordResponseDTO();
        response.setId(record.getId());
        response.setPetId(record.getPetId());
        response.setPetName(record.getPetName());
        response.setSpecies(record.getSpecies());
        response.setBreed(record.getBreed());
        response.setAge(record.getAge());
        response.setWeight(record.getWeight());
        response.setOwnerName(record.getOwnerName());
        response.setCreatedAt(record.getCreatedAt());
        response.setUpdatedAt(record.getUpdatedAt());
        response.setPastConsultations(consultations.stream()
                .map(this::mapToConsultationDTO)
                .collect(Collectors.toList()));

        return response;
    }

    private MedicalRecord normalizeAndPersistSpeciesBreed(MedicalRecord record, String petId) {
        boolean dirty = false;

        if (record.getSpecies() != null && record.getSpecies().contains(" - ")) {
            String value = record.getSpecies().trim();
            int sep = value.indexOf(" - ");
            record.setSpecies(value.substring(0, sep).trim());
            if (record.getBreed() == null || record.getBreed().isBlank()) {
                record.setBreed(value.substring(sep + 3).trim());
            }
            dirty = true;
        }

        Appointment appointment = appointmentRepository.findAll().stream()
                .filter(a -> petId.equals(a.getPetId()))
                .findFirst()
                .orElse(null);

        if (appointment != null) {
            AppointmentService.normalizeSpeciesBreed(appointment);
            if (record.getSpecies() == null || record.getSpecies().isBlank()
                    || record.getSpecies().contains(" - ")
                    || "Unknown".equalsIgnoreCase(record.getSpecies())) {
                if (appointment.getSpecies() != null && !appointment.getSpecies().isBlank()) {
                    record.setSpecies(appointment.getSpecies());
                    dirty = true;
                }
            }
            if (record.getBreed() == null || record.getBreed().isBlank()) {
                if (appointment.getBreed() != null && !appointment.getBreed().isBlank()) {
                    record.setBreed(appointment.getBreed());
                    dirty = true;
                }
            }
            // Prefer appointment's split values when EMR still has combined legacy text
            if (appointment.getSpecies() != null && appointment.getBreed() != null
                    && (record.getSpecies() == null || record.getSpecies().contains(" - ")
                    || record.getBreed() == null || record.getBreed().isBlank())) {
                record.setSpecies(appointment.getSpecies());
                record.setBreed(appointment.getBreed());
                dirty = true;
            }
        }

        if (dirty) {
            record.setUpdatedAt(LocalDateTime.now());
            return medicalRecordRepository.save(record);
        }
        return record;
    }

    public MedicalRecordResponseDTO updateWeight(String petId, Double weight) {
        if (weight == null || weight <= 0) {
            throw new IllegalArgumentException("Enter a realistic weight greater than 0 kg.");
        }

        MedicalRecord record = medicalRecordRepository.findByPetId(petId)
                .orElseGet(() -> createFromAppointments(petId));
        record.setWeight(weight);
        record.setUpdatedAt(LocalDateTime.now());
        medicalRecordRepository.save(record);

        appointmentRepository.findAll().stream()
                .filter(a -> petId.equals(a.getPetId()))
                .forEach(appointment -> {
                    appointment.setWeight(weight);
                    appointmentRepository.save(appointment);
                });

        return getMedicalRecordByPetId(petId);
    }

    private MedicalRecord fillMissingDemographics(MedicalRecord record, String petId) {
        Appointment appointment = appointmentRepository.findAll().stream()
                .filter(a -> petId.equals(a.getPetId()))
                .findFirst()
                .orElse(null);
        if (appointment == null) return record;

        boolean dirty = false;
        if (record.getAge() == null || record.getAge() == 0) {
            if (appointment.getAge() != null && appointment.getAge() > 0) {
                record.setAge(appointment.getAge());
                dirty = true;
            }
        }
        if (record.getWeight() == null || record.getWeight() == 0) {
            if (appointment.getWeight() != null && appointment.getWeight() > 0) {
                record.setWeight(appointment.getWeight());
                dirty = true;
            }
        }
        if (dirty) {
            record.setUpdatedAt(LocalDateTime.now());
            return medicalRecordRepository.save(record);
        }
        return record;
    }

    private MedicalRecord createFromAppointments(String petId) {
        Appointment appointment = appointmentRepository.findAll().stream()
                .filter(a -> petId.equals(a.getPetId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found for petId: " + petId));

        AppointmentService.normalizeSpeciesBreed(appointment);

        MedicalRecord record = new MedicalRecord();
        record.setPetId(petId);
        record.setPetName(appointment.getPetName());
        record.setSpecies(appointment.getSpecies() != null ? appointment.getSpecies() : "Unknown");
        record.setBreed(appointment.getBreed() != null ? appointment.getBreed() : "");
        record.setAge(appointment.getAge() != null ? appointment.getAge() : 0);
        record.setWeight(appointment.getWeight() != null ? appointment.getWeight() : 0.0);
        record.setOwnerName(appointment.getOwnerName());
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        return medicalRecordRepository.save(record);
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
        dto.setSymptoms(consultation.getSymptoms());
        dto.setObservations(consultation.getObservations());
        dto.setVitalSigns(consultation.getVitalSigns());
        dto.setDiagnosis(consultation.getDiagnosis());
        dto.setDiagnosisSeverity(consultation.getDiagnosisSeverity());
        dto.setTreatmentPlan(consultation.getTreatmentPlan());
        dto.setTreatmentType(consultation.getTreatmentType());
        dto.setTreatmentDuration(consultation.getTreatmentDuration());
        dto.setPrescriptions(consultation.getPrescriptions());
        dto.setNotes(consultation.getNotes());
        dto.setFollowUpDate(consultation.getFollowUpDate());
        dto.setCreatedAt(consultation.getCreatedAt());
        dto.setUpdatedAt(consultation.getUpdatedAt());
        return dto;
    }
}
