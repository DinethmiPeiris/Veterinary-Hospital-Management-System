package com.vhms.vhms.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.appointment.CreateAppointmentRequest;
import com.vhms.vhms.dto.appointment.ReassignDoctorRequest;
import com.vhms.vhms.dto.appointment.RescheduleAppointmentRequest;
import com.vhms.vhms.dto.appointment.UpdateAppointmentStatusRequest;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.exception.SlotConflictException;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.AppointmentStatus;
import com.vhms.vhms.model.NotificationType;
import com.vhms.vhms.repository.AppointmentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    private static final List<AppointmentStatus> CONFLICT_STATUSES = Arrays.asList(
            AppointmentStatus.REQUESTED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.IN_PROGRESS
    );

    @jakarta.annotation.PostConstruct
    public void initResetApt0002() {
        try {
            appointmentRepository.findByAppointmentNumber("APT-0002").ifPresent(a -> {
                a.setRebookAllowed(false);
                appointmentRepository.save(a);
            });
        } catch (Exception ignored) {}
    }

    public Appointment createAppointment(CreateAppointmentRequest request) {
        // Validate conflict
        boolean conflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
                request.getDoctorId(),
                request.getAppointmentDate(),
                request.getTimeSlot(),
                CONFLICT_STATUSES
        );

        if (conflict) {
            throw new SlotConflictException("The time slot " + request.getTimeSlot() + " on " + request.getAppointmentDate() + " is already booked for this veterinarian.");
        }

        Appointment appointment = Appointment.builder()
                .appointmentNumber(generateAppointmentNumber())
                .petId(request.getPetId())
                .petName(request.getPetName())
                .petSpecies(request.getPetSpecies())
                .petBreed(request.getPetBreed())
                .petAge(request.getPetAge())
                .ownerId(request.getOwnerId())
                .ownerName(request.getOwnerName())
                .ownerPhone(request.getOwnerPhone())
                .ownerEmail(request.getOwnerEmail())
                .doctorId(request.getDoctorId())
                .doctorName(request.getDoctorName() != null ? request.getDoctorName() : "Assigned Veterinarian")
                .doctorSpecialization(request.getDoctorSpecialization())
                .appointmentType(request.getAppointmentType())
                .appointmentDate(request.getAppointmentDate())
                .timeSlot(request.getTimeSlot())
                .status(AppointmentStatus.REQUESTED)
                .reasonForVisit(request.getReasonForVisit())
                .symptoms(request.getSymptoms())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Send submission notification to Pet Owner
        notificationService.sendNotification(
                saved.getOwnerId(),
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.APPOINTMENT_REQUESTED,
                "Appointment Request Submitted",
                "Your appointment request for " + saved.getPetName() + " on " + saved.getAppointmentDate()
                        + " at " + saved.getTimeSlot() + " with " + saved.getDoctorName() + " has been submitted (" + saved.getAppointmentNumber() + "). Waiting for hospital confirmation.",
                "APPOINTMENT",
                saved.getId()
        );

        // Notify Admin (All requests route through Admin; doctor is NOT notified until Admin confirms)
        notificationService.sendNotification(
                "ADMIN-001",
                "ADMIN",
                null,
                null,
                NotificationType.APPOINTMENT_REQUESTED,
                "New Appointment Request",
                "New appointment request for " + saved.getPetName() + " (Owner: " + saved.getOwnerName() + ") on " + saved.getAppointmentDate() + " (" + saved.getTimeSlot() + ") with " + saved.getDoctorName() + " (" + saved.getAppointmentNumber() + "). Please review and confirm.",
                "APPOINTMENT",
                saved.getId()
        );

        return saved;
    }

    public Appointment getAppointmentById(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
    }

    public Appointment getAppointmentByNumber(String appointmentNumber) {
        return appointmentRepository.findByAppointmentNumber(appointmentNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with number: " + appointmentNumber));
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAppointmentsByOwner(String ownerId) {
        return appointmentRepository.findByOwnerIdOrderByAppointmentDateDesc(ownerId);
    }

    public List<Appointment> getAppointmentsByDoctor(String doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDesc(doctorId)
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.REQUESTED)
                .collect(Collectors.toList());
    }

    public List<Appointment> getDoctorDailyAgenda(String doctorId, String date) {
        String queryDate = (date != null && !date.isBlank()) ? date : LocalDate.now().toString();
        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, queryDate)
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.REQUESTED && a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.REJECTED)
                .collect(Collectors.toList());
    }

    public List<Appointment> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findByStatus(status);
    }

    public Appointment approveAppointment(String id) {
        Appointment appointment = getAppointmentById(id);
        if (appointment.getStatus() != AppointmentStatus.REQUESTED) {
            throw new InvalidOperationException("Only REQUESTED appointments can be approved. Current status: " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        // Notify Pet Owner
        notificationService.sendNotification(
                saved.getOwnerId(),
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.APPOINTMENT_CONFIRMED,
                "Appointment Confirmed!",
                "Great news! Your appointment for " + saved.getPetName() + " on " + saved.getAppointmentDate()
                        + " at " + saved.getTimeSlot() + " is confirmed with " + saved.getDoctorName() + ".",
                "APPOINTMENT",
                saved.getId()
        );

        // Notify Doctor on confirmation by Admin
        notificationService.sendNotification(
                saved.getDoctorId(),
                "DOCTOR",
                null,
                null,
                NotificationType.APPOINTMENT_ASSIGNED,
                "New Confirmed Appointment Assigned",
                "An appointment for " + saved.getPetName() + " (" + saved.getAppointmentNumber() + ") on " + saved.getAppointmentDate()
                        + " (" + saved.getTimeSlot() + ") has been confirmed by Admin and assigned to your schedule.",
                "APPOINTMENT",
                saved.getId()
        );

        return saved;
    }

    public Appointment rejectAppointment(String id, String reason) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.REJECTED);
        appointment.setRejectionReason(reason);
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        // Notify Pet Owner with Options
        String docName = saved.getDoctorName() != null ? saved.getDoctorName() : "assigned doctor";
        String cleanReason = (reason != null && !reason.isBlank()) ? reason : "Doctor unavailable on this slot.";
        notificationService.sendNotification(
                saved.getOwnerId(),
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.APPOINTMENT_REJECTED,
                "Appointment Request Declined (" + saved.getAppointmentNumber() + ")",
                "Your appointment for " + saved.getPetName() + " was declined: " + cleanReason + ". Please choose an option: 1) Select a different time with " + docName + ", or 2) Choose an alternative doctor.",
                "APPOINTMENT",
                saved.getId()
        );

        return saved;
    }

    public Appointment reassignDoctor(String id, ReassignDoctorRequest request) {
        Appointment appointment = getAppointmentById(id);

        String targetDate = (request.getNewAppointmentDate() != null && !request.getNewAppointmentDate().isBlank())
                ? request.getNewAppointmentDate() : appointment.getAppointmentDate();
        String targetSlot = (request.getNewTimeSlot() != null && !request.getNewTimeSlot().isBlank())
                ? request.getNewTimeSlot() : appointment.getTimeSlot();

        // Conflict check on new doctor
        boolean conflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
                request.getNewDoctorId(),
                targetDate,
                targetSlot,
                CONFLICT_STATUSES
        );

        if (conflict) {
            throw new SlotConflictException("Doctor " + request.getNewDoctorName() + " is already booked for " + targetDate + " (" + targetSlot + ").");
        }

        appointment.setPreviousDoctorId(appointment.getDoctorId());
        appointment.setPreviousDoctorName(appointment.getDoctorName());
        appointment.setDoctorId(request.getNewDoctorId());
        appointment.setDoctorName(request.getNewDoctorName());
        if (request.getNewDoctorSpecialization() != null) {
            appointment.setDoctorSpecialization(request.getNewDoctorSpecialization());
        }
        appointment.setAppointmentDate(targetDate);
        appointment.setTimeSlot(targetSlot);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        if (request.getReassignmentReason() != null) {
            appointment.setAdminNotes("Reassigned: " + request.getReassignmentReason());
        }
        appointment.setUpdatedAt(LocalDateTime.now());

        Appointment saved = appointmentRepository.save(appointment);

        // Notify Pet Owner
        String prevDoc = saved.getPreviousDoctorName();
        String currentDoc = saved.getDoctorName();
        String noticeMsg = (prevDoc != null && !prevDoc.equalsIgnoreCase(currentDoc) && !prevDoc.equalsIgnoreCase("Assigned Veterinarian"))
                ? "Your appointment for " + saved.getPetName() + " on " + saved.getAppointmentDate() + " (" + saved.getTimeSlot() + ") is confirmed with " + currentDoc + " (Allocated as " + prevDoc + " is off-duty on this date)."
                : "Your appointment for " + saved.getPetName() + " has been assigned to " + currentDoc + " on " + saved.getAppointmentDate() + " at " + saved.getTimeSlot() + ".";

        notificationService.sendNotification(
                saved.getOwnerId(),
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.APPOINTMENT_RESCHEDULED,
                "Veterinarian Allocated & Confirmed",
                noticeMsg,
                "APPOINTMENT",
                saved.getId()
        );

        // Notify New Doctor
        notificationService.sendNotification(
                saved.getDoctorId(),
                "DOCTOR",
                null,
                null,
                NotificationType.APPOINTMENT_ASSIGNED,
                "Reassigned Appointment Added",
                "An appointment for " + saved.getPetName() + " (" + saved.getAppointmentNumber() + ") on " + saved.getAppointmentDate() + " (" + saved.getTimeSlot() + ") was assigned to you.",
                "APPOINTMENT",
                saved.getId()
        );

        return saved;
    }

    public Appointment rescheduleAppointment(String id, RescheduleAppointmentRequest request) {
        Appointment appointment = getAppointmentById(id);

        String targetDoctorId = (request.getOptionalNewDoctorId() != null && !request.getOptionalNewDoctorId().isBlank())
                ? request.getOptionalNewDoctorId() : appointment.getDoctorId();

        // Conflict check
        boolean conflict = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
                targetDoctorId,
                request.getNewAppointmentDate(),
                request.getNewTimeSlot(),
                CONFLICT_STATUSES
        );

        if (conflict) {
            throw new SlotConflictException("The time slot " + request.getNewTimeSlot() + " on " + request.getNewAppointmentDate() + " is already occupied.");
        }

        boolean wasRejected = appointment.getStatus() == AppointmentStatus.REJECTED;

        appointment.setAppointmentDate(request.getNewAppointmentDate());
        appointment.setTimeSlot(request.getNewTimeSlot());
        if (request.getOptionalNewDoctorId() != null && !request.getOptionalNewDoctorId().isBlank()) {
            appointment.setPreviousDoctorId(appointment.getDoctorId());
            appointment.setPreviousDoctorName(appointment.getDoctorName());
            appointment.setDoctorId(request.getOptionalNewDoctorId());
            if (request.getOptionalNewDoctorName() != null && !request.getOptionalNewDoctorName().isBlank()) {
                appointment.setDoctorName(request.getOptionalNewDoctorName());
            }
        }
        
        // If it was rejected, put it back to REQUESTED for admin approval
        if (wasRejected) {
            appointment.setStatus(AppointmentStatus.REQUESTED);
            appointment.setRejectionReason(null);
        } else {
            appointment.setStatus(AppointmentStatus.RESCHEDULED);
        }

        if (request.getRescheduleReason() != null) {
            appointment.setAdminNotes((wasRejected ? "Re-selected after rejection: " : "Rescheduled: ") + request.getRescheduleReason());
        }
        appointment.setUpdatedAt(LocalDateTime.now());

        Appointment saved = appointmentRepository.save(appointment);

        // Notify Pet Owner
        notificationService.sendNotification(
                saved.getOwnerId(),
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.APPOINTMENT_RESCHEDULED,
                wasRejected ? "Appointment Resubmitted" : "Appointment Rescheduled",
                "Your appointment for " + saved.getPetName() + " is now moved to " + saved.getAppointmentDate()
                        + " at " + saved.getTimeSlot() + " with " + saved.getDoctorName() + ".",
                "APPOINTMENT",
                saved.getId()
        );

        // Notify Assigned Doctor
        if (saved.getDoctorId() != null && !saved.getDoctorId().isBlank()) {
            notificationService.sendNotification(
                    saved.getDoctorId(),
                    "DOCTOR",
                    null,
                    null,
                    NotificationType.APPOINTMENT_RESCHEDULED,
                    "Appointment #" + saved.getAppointmentNumber() + " Rescheduled",
                    "Patient " + saved.getPetName() + " (" + saved.getOwnerName() + ") is now rescheduled to " + saved.getAppointmentDate() + " at " + saved.getTimeSlot() + ".",
                    "APPOINTMENT",
                    saved.getId()
            );
        }

        // Notify Admin if it was re-selected after rejection
        if (wasRejected) {
            notificationService.sendNotification(
                    "ADMIN-001",
                    "ADMIN",
                    null,
                    null,
                    NotificationType.APPOINTMENT_RESCHEDULED,
                    "Re-selected Appointment: " + saved.getAppointmentNumber(),
                    "Pet owner re-selected " + saved.getDoctorName() + " on " + saved.getAppointmentDate() + " (" + saved.getTimeSlot() + ") for " + saved.getPetName() + ". Ready for approval.",
                    "APPOINTMENT",
                    saved.getId()
            );
        }

        return saved;
    }

    public Appointment cancelAppointment(String id, String reason, String cancelledBy) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        appointment.setCancelledBy(cancelledBy != null ? cancelledBy : "ADMIN");
        appointment.setUpdatedAt(LocalDateTime.now());

        Appointment saved = appointmentRepository.save(appointment);

        // Notify Pet Owner
        notificationService.sendNotification(
                saved.getOwnerId(),
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.APPOINTMENT_CANCELLED,
                "Appointment Cancelled",
                "Your appointment (" + saved.getAppointmentNumber() + ") for " + saved.getPetName()
                        + " has been cancelled. Reason: " + (reason != null ? reason : "Cancelled by " + appointment.getCancelledBy()),
                "APPOINTMENT",
                saved.getId()
        );

        return saved;
    }

    public Appointment markCompleted(String id, String doctorNotes) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.COMPLETED);
        if (doctorNotes != null) {
            appointment.setDoctorNotes(doctorNotes);
        }
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    public Appointment sendManualReminder(String id) {
        Appointment appointment = getAppointmentById(id);

        String recipientId = (appointment.getOwnerId() != null && !appointment.getOwnerId().trim().isEmpty())
                ? appointment.getOwnerId()
                : "USR-5001";

        notificationService.sendNotification(
                recipientId,
                "PET_OWNER",
                appointment.getOwnerEmail(),
                appointment.getOwnerPhone(),
                NotificationType.APPOINTMENT_REMINDER,
                "Upcoming Appointment Reminder 🔔",
                "Reminder: Your appointment (" + (appointment.getAppointmentNumber() != null ? appointment.getAppointmentNumber() : id) + ") for " + appointment.getPetName() + " is scheduled on "
                        + appointment.getAppointmentDate() + " at " + appointment.getTimeSlot() + " with " + appointment.getDoctorName() + " at Sri Jayawardanapura Animal Hospital.",
                "APPOINTMENT",
                appointment.getId()
        );

        return appointment;
    }

    public Appointment updateStatus(String id, UpdateAppointmentStatusRequest request) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(request.getStatus());
        if (request.getReason() != null) {
            if (request.getStatus() == AppointmentStatus.REJECTED) {
                appointment.setRejectionReason(request.getReason());
            } else if (request.getStatus() == AppointmentStatus.CANCELLED) {
                appointment.setCancellationReason(request.getReason());
            }
        }
        if (request.getCancelledBy() != null) {
            appointment.setCancelledBy(request.getCancelledBy());
        }
        if (request.getDoctorNotes() != null) {
            appointment.setDoctorNotes(request.getDoctorNotes());
        }
        if (request.getAdminNotes() != null) {
            appointment.setAdminNotes(request.getAdminNotes());
        }
        Appointment saved = appointmentRepository.save(appointment);

        if (request.getStatus() == AppointmentStatus.EXPIRED || request.getStatus() == AppointmentStatus.NO_SHOW) {
            // Notify Admin ONLY (Centralized workflow: Admin reviews and decides when to notify pet owner for rebooking)
            notificationService.sendNotification(
                    "ADMIN-001",
                    "ADMIN",
                    "admin@hospital.com",
                    null,
                    NotificationType.APPOINTMENT_CANCELLED,
                    "⚠️ Appointment Marked Expired / No-Show",
                    "Appointment #" + saved.getAppointmentNumber() + " for " + saved.getPetName()
                            + " was marked as Expired (No-Show) by " + (saved.getDoctorName() != null ? saved.getDoctorName() : "Doctor") + ".",
                    "APPOINTMENT",
                    saved.getId()
            );
        }

        return saved;
    }

    // Admin-mediated action: Admin triggers re-booking notification to Pet Owner
    public Appointment sendRebookAlertToOwner(String id) {
        Appointment appointment = getAppointmentById(id);
        appointment.setRebookAllowed(true);
        Appointment saved = appointmentRepository.save(appointment);

        notificationService.sendNotification(
                saved.getOwnerId() != null ? saved.getOwnerId() : "USR-5001",
                "PET_OWNER",
                saved.getOwnerEmail(),
                saved.getOwnerPhone(),
                NotificationType.APPOINTMENT_CANCELLED,
                "Appointment Expired - Re-booking Available ⌛",
                "Your scheduled appointment (" + saved.getAppointmentNumber() + ") for " + saved.getPetName()
                        + " on " + saved.getAppointmentDate() + " was marked as expired. Hospital Admin has opened the re-booking option for you. Please visit your Pet Owner Portal to book a new slot if care is needed.",
                "APPOINTMENT",
                saved.getId()
        );

        return saved;
    }

    private synchronized String generateAppointmentNumber() {
        String prefix = "APT-";

        List<Appointment> existing = appointmentRepository.findByAppointmentNumberStartingWith(prefix);
        java.util.Set<Integer> usedSeqs = new java.util.HashSet<>();
        for (Appointment a : existing) {
            String num = a.getAppointmentNumber();
            if (num != null && num.startsWith(prefix)) {
                String[] parts = num.split("-");
                try {
                    int seq = Integer.parseInt(parts[parts.length - 1]);
                    usedSeqs.add(seq);
                } catch (NumberFormatException ignored) {}
            }
        }
        int seq = 1;
        while (usedSeqs.contains(seq)) {
            seq++;
        }
        return String.format("%s%04d", prefix, seq);
    }
}
