package com.vhms.vhms.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.AppointmentResponseDTO;
import com.vhms.vhms.dto.AppointmentStatusUpdateDTO;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.repository.AppointmentRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "SCHEDULED", "WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"
    );

    private final AppointmentRepository appointmentRepository;

    @PostConstruct
    public void ensureDemoAppointments() {
        upsertDemo(
                "APP-101", "09:30 AM", "Buddy", "Dog", "Golden Retriever",
                "John Doe", "Annual checkup and vaccination", "COMPLETED", "PET-101", 4, 32.5);
        upsertDemo(
                "APP-102", "10:00 AM", "Luna", "Cat", "Persian",
                "Sarah Smith", "Not eating for 2 days", "COMPLETED", "PET-102", 3, 4.2);
        upsertDemo(
                "APP-103", "11:15 AM", "Max", "Dog", "German Shepherd",
                "Mike Johnson", "Limping on back right leg", "COMPLETED", "PET-103", 5, 34.0);
        upsertDemo(
                "APP-104", "01:00 PM", "Coco", "Dog", "Poodle",
                "Nimal Perera", "Vaccination booster", "SCHEDULED", "PET-104", 2, 8.5);
        upsertDemo(
                "APP-105", "01:45 PM", "Milo", "Cat", "Siamese",
                "Amaya Silva", "Skin irritation and itching", "WAITING", "PET-105", 4, 5.1);
        upsertDemo(
                "APP-106", "02:30 PM", "Rocky", "Dog", "Labrador",
                "Kasun Fernando", "Ear infection follow-up", "SCHEDULED", "PET-106", 6, 30.0);
        upsertDemo(
                "APP-107", "03:15 PM", "Bella", "Cat", "British Shorthair",
                "Dilani Jayasuriya", "Dental checkup", "WAITING", "PET-107", 3, 5.8);
        upsertDemo(
                "APP-108", "04:00 PM", "Charlie", "Dog", "Beagle",
                "Ruwan Bandara", "Vomiting since yesterday", "IN_PROGRESS", "PET-108", 7, 12.4);
    }

    private void upsertDemo(
            String id, String time, String petName, String species, String breed,
            String owner, String reason, String status, String petId, int age, double weight) {
        Appointment existing = appointmentRepository.findById(id).orElse(null);
        if (existing == null) {
            appointmentRepository.save(demoAppointment(
                    id, time, petName, species, breed, owner, reason, status, petId, age, weight));
            return;
        }

        boolean dirty = false;
        normalizeSpeciesBreed(existing);

        if (existing.getTime() == null || existing.getTime().isBlank() || !time.equals(existing.getTime())) {
            existing.setTime(time);
            dirty = true;
        }
        if (existing.getSpecies() == null || existing.getSpecies().isBlank()
                || existing.getSpecies().contains(" - ")
                || "Pet".equalsIgnoreCase(existing.getSpecies())) {
            existing.setSpecies(species);
            dirty = true;
        }
        if (existing.getBreed() == null || existing.getBreed().isBlank()) {
            existing.setBreed(breed);
            dirty = true;
        }
        if (existing.getPetName() == null || existing.getPetName().isBlank()) {
            existing.setPetName(petName);
            dirty = true;
        }
        if (existing.getOwnerName() == null || existing.getOwnerName().isBlank()) {
            existing.setOwnerName(owner);
            dirty = true;
        }
        if (existing.getReason() == null || existing.getReason().isBlank()) {
            existing.setReason(reason);
            dirty = true;
        }
        if (existing.getPetId() == null || existing.getPetId().isBlank()) {
            existing.setPetId(petId);
            dirty = true;
        }
        if (existing.getAge() == null || existing.getAge() == 0) {
            existing.setAge(age);
            dirty = true;
        }
        if (existing.getWeight() == null || existing.getWeight() == 0) {
            existing.setWeight(weight);
            dirty = true;
        }
        // Keep starter test appointments in the intended status for filter demos
        if ("APP-104".equals(id) || "APP-105".equals(id) || "APP-106".equals(id)
                || "APP-107".equals(id) || "APP-108".equals(id)) {
            if (!status.equals(existing.getStatus())) {
                existing.setStatus(status);
                dirty = true;
            }
        }

        if (!species.equals(existing.getSpecies()) || !breed.equals(nullToEmpty(existing.getBreed()))) {
            existing.setSpecies(species);
            existing.setBreed(breed);
            dirty = true;
        }

        if (dirty) {
            appointmentRepository.save(existing);
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    /** Split legacy values like "Dog - Golden Retriever" into species + breed. */
    static void normalizeSpeciesBreed(Appointment appointment) {
        if (appointment == null || appointment.getSpecies() == null) return;
        String value = appointment.getSpecies().trim();
        int sep = value.indexOf(" - ");
        if (sep > 0) {
            String speciesPart = value.substring(0, sep).trim();
            String breedPart = value.substring(sep + 3).trim();
            appointment.setSpecies(speciesPart);
            if (appointment.getBreed() == null || appointment.getBreed().isBlank()) {
                appointment.setBreed(breedPart);
            }
        }
    }

    public List<AppointmentResponseDTO> getAllAppointments() {
        return appointmentRepository.findAllByOrderByAppointmentDateAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public AppointmentResponseDTO getAppointment(String id) {
        return toDto(findAppointment(id));
    }

    public AppointmentResponseDTO updateStatus(String id, AppointmentStatusUpdateDTO request) {
        String status = request.getStatus().trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Unsupported appointment status: " + request.getStatus());
        }

        Appointment appointment = findAppointment(id);
        appointment.setStatus(status);
        return toDto(appointmentRepository.save(appointment));
    }

    private Appointment findAppointment(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
    }

    private Appointment demoAppointment(
            String id, String time, String petName, String species, String breed,
            String owner, String reason, String status, String petId, int age, double weight) {
        Appointment appointment = new Appointment();
        appointment.setId(id);
        appointment.setTime(time);
        appointment.setPetName(petName);
        appointment.setSpecies(species);
        appointment.setBreed(breed);
        appointment.setOwnerName(owner);
        appointment.setReason(reason);
        appointment.setStatus(status);
        appointment.setPetId(petId);
        appointment.setAge(age);
        appointment.setWeight(weight);
        appointment.setDoctorId("DOC-001");
        appointment.setDoctorName("Dr. Smith");
        appointment.setAppointmentDate(LocalDateTime.now());
        return appointment;
    }

    private AppointmentResponseDTO toDto(Appointment appointment) {
        normalizeSpeciesBreed(appointment);
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.setId(appointment.getId());
        dto.setTime(resolveTime(appointment));
        dto.setPatient(appointment.getPetName());
        dto.setSpecies(appointment.getSpecies() != null ? appointment.getSpecies() : "Pet");
        dto.setBreed(appointment.getBreed() != null ? appointment.getBreed() : "");
        dto.setOwner(appointment.getOwnerName());
        dto.setReason(appointment.getReason());
        dto.setStatus(appointment.getStatus());
        dto.setPetId(appointment.getPetId());
        dto.setDoctorId(appointment.getDoctorId());
        dto.setDoctorName(appointment.getDoctorName());
        return dto;
    }

    private String resolveTime(Appointment appointment) {
        if (appointment.getTime() != null && !appointment.getTime().isBlank()) {
            return appointment.getTime();
        }
        if (appointment.getAppointmentDate() != null) {
            return appointment.getAppointmentDate()
                    .format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
        }
        return "--:--";
    }
}
