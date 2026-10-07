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
import com.vhms.vhms.repository.PetRepository;
import com.vhms.vhms.model.Pet;
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
    private final PetRepository petRepository;

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
        response.setVaccinations(record.getVaccinations() != null ? record.getVaccinations() : new java.util.ArrayList<>());
        response.setDocuments(record.getDocuments() != null ? record.getDocuments() : new java.util.ArrayList<>());
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
            // AppointmentService.normalizeSpeciesBreed(appointment);
            if (record.getSpecies() == null || record.getSpecies().isBlank()
                    || record.getSpecies().contains(" - ")
                    || "Unknown".equalsIgnoreCase(record.getSpecies())) {
                if (appointment.getPetSpecies() != null && !appointment.getPetSpecies().isBlank()) {
                    record.setSpecies(appointment.getPetSpecies());
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
            if (appointment.getPetSpecies() != null && appointment.getBreed() != null
                    && (record.getSpecies() == null || record.getSpecies().contains(" - ")
                    || record.getBreed() == null || record.getBreed().isBlank())) {
                record.setSpecies(appointment.getPetSpecies());
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

        petRepository.findById(petId).ifPresent(pet -> {
            pet.setWeight(weight);
            petRepository.save(pet);
        });

        appointmentRepository.findAll().stream()
                .filter(a -> petId.equals(a.getPetId()))
                .forEach(appointment -> {
                    appointment.setWeight(weight);
                    appointmentRepository.save(appointment);
                });

        return getMedicalRecordByPetId(petId);
    }

    public MedicalRecordResponseDTO addVaccination(String petId, com.vhms.vhms.model.Vaccination vaccination) {
        MedicalRecord record = medicalRecordRepository.findByPetId(petId)
                .orElseGet(() -> createFromAppointments(petId));

        if (record.getVaccinations() == null) {
            record.setVaccinations(new java.util.ArrayList<>());
        }
        record.getVaccinations().add(vaccination);
        record.setUpdatedAt(LocalDateTime.now());
        medicalRecordRepository.save(record);

        return getMedicalRecordByPetId(petId);
    }

    public MedicalRecordResponseDTO addDocument(String petId, com.vhms.vhms.model.MedicalDocument document) {
        MedicalRecord record = medicalRecordRepository.findByPetId(petId)
                .orElseGet(() -> createFromAppointments(petId));

        if (record.getDocuments() == null) {
            record.setDocuments(new java.util.ArrayList<>());
        }
        
        if (document.getDocumentId() == null) {
            document.setDocumentId(java.util.UUID.randomUUID().toString());
        }
        if (document.getUploadedAt() == null) {
            document.setUploadedAt(LocalDateTime.now());
        }
        
        record.getDocuments().add(document);
        record.setUpdatedAt(LocalDateTime.now());
        medicalRecordRepository.save(record);

        return getMedicalRecordByPetId(petId);
    }

    public void deleteDocument(String petId, String documentId) {
        MedicalRecord record = medicalRecordRepository.findByPetId(petId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found for petId: " + petId));

        if (record.getDocuments() != null) {
            boolean removed = record.getDocuments().removeIf(doc -> documentId.equals(doc.getDocumentId()));
            if (removed) {
                record.setUpdatedAt(LocalDateTime.now());
                medicalRecordRepository.save(record);
            }
        }
    }

    private Integer resolveAge(Appointment appointment) {
        // Prefer the legacy Integer field if it has a real value
        if (appointment.getAge() != null && appointment.getAge() > 0) {
            return appointment.getAge();
        }
        // Fall back to the primary petAge (String) field
        if (appointment.getPetAge() != null && !appointment.getPetAge().isBlank()) {
            try {
                int parsed = Integer.parseInt(appointment.getPetAge().replaceAll("[^0-9]", ""));
                if (parsed > 0) return parsed;
            } catch (NumberFormatException ignored) { }
        }
        return null;
    }

    private MedicalRecord fillMissingDemographics(MedicalRecord record, String petId) {
        boolean dirty = false;
        
        Pet pet = petRepository.findById(petId).orElse(null);
        if (pet != null) {
            if ((record.getAge() == null || record.getAge() == 0) && pet.getAge() > 0) {
                record.setAge(pet.getAge());
                dirty = true;
            }
            if ((record.getWeight() == null || record.getWeight() == 0) && pet.getWeight() > 0) {
                record.setWeight(pet.getWeight());
                dirty = true;
            }
        }

        if (record.getAge() == null || record.getAge() == 0 || record.getWeight() == null || record.getWeight() == 0) {
            Appointment appointment = appointmentRepository.findAll().stream()
                    .filter(a -> petId.equals(a.getPetId()))
                    .findFirst()
                    .orElse(null);
            if (appointment != null) {
                if (record.getAge() == null || record.getAge() == 0) {
                    Integer resolvedAge = resolveAge(appointment);
                    if (resolvedAge != null && resolvedAge > 0) {
                        record.setAge(resolvedAge);
                        dirty = true;
                    }
                }
                if (record.getWeight() == null || record.getWeight() == 0) {
                    if (appointment.getWeight() != null && appointment.getWeight() > 0) {
                        record.setWeight(appointment.getWeight());
                        dirty = true;
                    }
                }
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

        Pet pet = petRepository.findById(petId).orElse(null);
        Integer resolvedAge = resolveAge(appointment);
        int finalAge = (pet != null && pet.getAge() > 0) ? pet.getAge() : (resolvedAge != null ? resolvedAge : 0);
        double finalWeight = (pet != null && pet.getWeight() > 0) ? pet.getWeight() : (appointment.getWeight() != null ? appointment.getWeight() : 0.0);

        MedicalRecord record = new MedicalRecord();
        record.setPetId(petId);
        record.setPetName(appointment.getPetName());
        record.setSpecies(appointment.getPetSpecies() != null ? appointment.getPetSpecies() : "Unknown");
        record.setBreed(appointment.getBreed() != null ? appointment.getBreed() : "");
        record.setAge(finalAge);
        record.setWeight(finalWeight);
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
