package com.vhms.vhms.service;

import com.vhms.vhms.dto.ConsultationRequestDTO;
import com.vhms.vhms.dto.ConsultationResponseDTO;
import com.vhms.vhms.dto.StatusUpdateDTO;
import com.vhms.vhms.exception.InvalidStatusTransitionException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.Consultation;
import com.vhms.vhms.model.ConsultationStatus;
import com.vhms.vhms.model.Doctor;
import com.vhms.vhms.model.MedicalRecord;
import com.vhms.vhms.repository.AppointmentRepository;
import com.vhms.vhms.repository.ConsultationRepository;
import com.vhms.vhms.repository.DoctorRepository;
import com.vhms.vhms.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    public ConsultationResponseDTO startConsultation(String appointmentId, String doctorId) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        Doctor doctor = doctorRepository.findById(doctorId)
                .or(() -> doctorRepository.findByStaffIdIgnoreCase(doctorId))
                .orElse(null);

        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseGet(Consultation::new);

        consultation.setAppointmentId(appointmentId);
        consultation.setDoctorId(doctorId);
        consultation.setStatus(ConsultationStatus.IN_PROGRESS);
        consultation.setConsultationDate(LocalDateTime.now());

        if (appointment != null) {
            consultation.setPetId(appointment.getPetId());
            consultation.setPetName(appointment.getPetName());
            consultation.setOwnerName(appointment.getOwnerName());
            appointment.setStatus("IN_PROGRESS");
            if (doctor != null) {
                appointment.setDoctorId(doctor.getStaffId() != null ? doctor.getStaffId() : doctor.getId());
                appointment.setDoctorName(doctor.getFullName());
            }
            appointmentRepository.save(appointment);
        } else {
            consultation.setPetId("PET-101");
            consultation.setPetName("Buddy");
            consultation.setOwnerName("John Doe");
        }

        if (doctor != null) {
            consultation.setDoctorName(doctor.getFullName());
        } else {
            consultation.setDoctorName("Doctor");
        }

        String petId = consultation.getPetId() != null ? consultation.getPetId() : "PET-101";
        final String petName = consultation.getPetName();
        final String ownerName = consultation.getOwnerName();
        final String species;
        final String breed;
        final Integer petAge;
        final Double petWeight;
        if (appointment != null) {
            AppointmentService.normalizeSpeciesBreed(appointment);
            species = appointment.getSpecies() != null ? appointment.getSpecies() : "Unknown";
            breed = appointment.getBreed() != null ? appointment.getBreed() : "";
            petAge = appointment.getAge();
            petWeight = appointment.getWeight();
        } else {
            species = "Unknown";
            breed = "";
            petAge = 0;
            petWeight = 0.0;
        }

        MedicalRecord record = medicalRecordRepository.findByPetId(petId).orElseGet(() -> {
            MedicalRecord newRecord = new MedicalRecord();
            newRecord.setPetId(petId);
            newRecord.setPetName(petName);
            newRecord.setSpecies(species);
            newRecord.setBreed(breed);
            newRecord.setAge(petAge != null ? petAge : 0);
            newRecord.setWeight(petWeight != null ? petWeight : 0.0);
            newRecord.setOwnerName(ownerName);
            return medicalRecordRepository.save(newRecord);
        });

        boolean recordDirty = false;
        if (record.getSpecies() != null && record.getSpecies().contains(" - ")) {
            String value = record.getSpecies();
            int sep = value.indexOf(" - ");
            record.setSpecies(value.substring(0, sep).trim());
            if (record.getBreed() == null || record.getBreed().isBlank()) {
                record.setBreed(value.substring(sep + 3).trim());
            }
            recordDirty = true;
        }
        if ((record.getBreed() == null || record.getBreed().isBlank()) && !breed.isBlank()) {
            record.setBreed(breed);
            recordDirty = true;
        }
        if ((record.getSpecies() == null || record.getSpecies().isBlank() || "Unknown".equals(record.getSpecies()))
                && !"Unknown".equals(species)) {
            record.setSpecies(species);
            recordDirty = true;
        }
        if ((record.getAge() == null || record.getAge() == 0) && petAge != null && petAge > 0) {
            record.setAge(petAge);
            recordDirty = true;
        }
        if ((record.getWeight() == null || record.getWeight() == 0) && petWeight != null && petWeight > 0) {
            record.setWeight(petWeight);
            recordDirty = true;
        }
        if (recordDirty) {
            record = medicalRecordRepository.save(record);
        }

        consultation.setMedicalRecordId(record.getId());
        consultation = consultationRepository.save(consultation);

        return mapToConsultationDTO(consultation);
    }
    
    public ConsultationResponseDTO updateConsultation(String id, ConsultationRequestDTO request) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));
                
        // Only allow updates if IN_PROGRESS
        if (consultation.getStatus() != ConsultationStatus.IN_PROGRESS) {
            throw new InvalidStatusTransitionException("Can only update consultation when IN_PROGRESS");
        }

        consultation.setSymptoms(request.getSymptoms());
        consultation.setObservations(request.getObservations());
        consultation.setVitalSigns(request.getVitalSigns());
        consultation.setDiagnosis(request.getDiagnosis());
        consultation.setDiagnosisSeverity(request.getDiagnosisSeverity());
        consultation.setTreatmentPlan(request.getTreatmentPlan());
        consultation.setTreatmentType(request.getTreatmentType());
        consultation.setTreatmentDuration(request.getTreatmentDuration());
        consultation.setPrescriptions(request.getPrescriptions());
        consultation.setNotes(request.getNotes());
        consultation.setFollowUpDate(request.getFollowUpDate());

        // If it is NOT a draft, complete it.
        if (!request.isDraft()) {
            consultation.setStatus(ConsultationStatus.COMPLETED);
            appointmentRepository.findById(consultation.getAppointmentId()).ifPresent(appointment -> {
                appointment.setStatus("COMPLETED");
                appointmentRepository.save(appointment);
            });
        } else {
            appointmentRepository.findById(consultation.getAppointmentId()).ifPresent(appointment -> {
                appointment.setStatus("IN_PROGRESS");
                appointmentRepository.save(appointment);
            });
        }

        consultation = consultationRepository.save(consultation);
        return mapToConsultationDTO(consultation);
    }
    
    public ConsultationResponseDTO getConsultation(String id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));
        return mapToConsultationDTO(consultation);
    }

    public ConsultationResponseDTO getConsultationByAppointmentId(String appointmentId) {
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Consultation not found for appointment: " + appointmentId));
        return mapToConsultationDTO(consultation);
    }

    public ConsultationResponseDTO updateStatus(String id, StatusUpdateDTO statusUpdate) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        ConsultationStatus current = consultation.getStatus();
        ConsultationStatus next = statusUpdate.getStatus();
        
        // Validation transitions
        if (current == ConsultationStatus.COMPLETED || current == ConsultationStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Cannot change status from terminal state: " + current);
        }
        
        if (current == ConsultationStatus.SCHEDULED && next == ConsultationStatus.COMPLETED) {
            throw new InvalidStatusTransitionException("Cannot jump from SCHEDULED directly to COMPLETED");
        }
        
        consultation.setStatus(next);
        consultation = consultationRepository.save(consultation);
        return mapToConsultationDTO(consultation);
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
