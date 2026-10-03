package com.vhms.vhms.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.Doctor;
import com.vhms.vhms.repository.AppointmentRepository;
import com.vhms.vhms.repository.DoctorRepository;

/**
 * Pet-owner portal appointment API (from IT24101204), exposed at {@code /api/appointments}.
 *
 * <p>The doctor workflow API at {@code /api/v1/appointments} ({@link AppointmentController}) is
 * untouched. Both operate on the same {@link Appointment} documents, so this controller normalises
 * the loosely-typed payloads sent by the pet-owner UI (string age/weight/date, slot labels) into the
 * typed fields the doctor/consultation workflow relies on.
 */
@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class PetOwnerAppointmentController {

    private static final DateTimeFormatter TIME_12H = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
    private static final Pattern NUMBER = Pattern.compile("-?\\d+(\\.\\d+)?");

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

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
    public ResponseEntity<Appointment> createAppointment(@RequestBody Map<String, Object> body) {
        Appointment appointment = new Appointment();

        String id = str(body, "id");
        if (id != null && !id.isEmpty() && !appointmentRepository.existsById(id)) {
            appointment.setId(id);
        } // otherwise let MongoDB assign a new unique id

        applyFields(appointment, body);
        resolveDoctor(appointment);

        if (appointment.getCreatedAt() == null) {
            appointment.setCreatedAt(LocalDateTime.now());
        }
        if (appointment.getStatus() == null || appointment.getStatus().isEmpty()) {
            appointment.setStatus("PENDING");
        }
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable String id,
            @RequestBody Map<String, Object> details) {
        Optional<Appointment> optional = appointmentRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Appointment appt = optional.get();

        if (str(details, "status") != null) {
            appt.setStatus(str(details, "status"));
        }
        if (str(details, "doctorNotes") != null) {
            appt.setDoctorNotes(str(details, "doctorNotes"));
        }
        if (str(details, "prescriptions") != null) {
            appt.setPrescriptions(str(details, "prescriptions"));
        }
        if (str(details, "diagnosis") != null) {
            appt.setDiagnosis(str(details, "diagnosis"));
        }
        if (str(details, "rejectReason") != null) {
            appt.setRejectReason(str(details, "rejectReason"));
        }
        if (str(details, "reason") != null) {
            appt.setReason(str(details, "reason"));
        }
        if (str(details, "date") != null) {
            appt.setDate(str(details, "date"));
        }
        if (str(details, "timeSlot") != null) {
            appt.setTimeSlot(str(details, "timeSlot"));
        }
        if (str(details, "date") != null || str(details, "timeSlot") != null) {
            appt.setTime(appt.getTimeSlot());
            appt.setAppointmentDate(null);
            syncDateTime(appt);
        }
        return ResponseEntity.ok(appointmentRepository.save(appt));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable String id) {
        if (appointmentRepository.existsById(id)) {
            appointmentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ------------------------------------------------------------------ helpers

    private void applyFields(Appointment a, Map<String, Object> m) {
        a.setPetOwnerId(str(m, "petOwnerId"));
        a.setPetOwnerName(str(m, "petOwnerName"));
        a.setOwnerName(str(m, "ownerName"));
        a.setPetOwnerEmail(str(m, "petOwnerEmail"));
        a.setPetOwnerPhone(str(m, "petOwnerPhone"));
        a.setPetId(str(m, "petId"));
        a.setPetName(str(m, "petName"));
        a.setSpecies(str(m, "species"));
        a.setBreed(str(m, "breed"));
        a.setAge(toInteger(m.get("age")));
        a.setWeight(toDouble(m.get("weight")));
        a.setGender(str(m, "gender"));
        a.setPhotoUrl(str(m, "photoUrl"));
        a.setDoctorId(str(m, "doctorId"));
        a.setDoctorName(str(m, "doctorName"));
        a.setDoctorEmail(str(m, "doctorEmail"));
        a.setSpecialization(str(m, "specialization"));
        a.setDate(str(m, "date"));
        a.setTimeSlot(str(m, "timeSlot"));
        a.setTime(str(m, "time"));
        a.setReason(str(m, "reason"));
        a.setStatus(str(m, "status"));
        a.setDoctorNotes(str(m, "doctorNotes"));
        a.setPrescriptions(str(m, "prescriptions"));
        a.setDiagnosis(str(m, "diagnosis"));
        a.setRejectReason(str(m, "rejectReason"));
        a.setAppointmentDate(toDateTime(m.get("appointmentDate")));

        // Keep the two naming schemes (pet-owner UI vs doctor workflow) in sync.
        if (a.getOwnerName() == null) {
            a.setOwnerName(a.getPetOwnerName());
        }
        if (a.getPetOwnerName() == null) {
            a.setPetOwnerName(a.getOwnerName());
        }
        if (a.getTime() == null) {
            a.setTime(a.getTimeSlot());
        }
        if (a.getTimeSlot() == null) {
            a.setTimeSlot(a.getTime());
        }
        syncDateTime(a);
    }

    /** Fill the typed {@code appointmentDate} (used by the doctor workflow) from {@code date} + slot. */
    private void syncDateTime(Appointment a) {
        if (a.getAppointmentDate() != null) {
            return;
        }
        LocalDateTime parsed = toDateTime(a.getDate());
        if (parsed == null) {
            return;
        }
        String slot = a.getTimeSlot() != null ? a.getTimeSlot() : a.getTime();
        if (slot != null) {
            try {
                parsed = parsed.toLocalDate().atTime(LocalTime.parse(slot.trim().toUpperCase(Locale.ENGLISH), TIME_12H));
            } catch (Exception ignored) {
                // keep start of day when the slot label isn't a clock time
            }
        }
        a.setAppointmentDate(parsed);
    }

    /**
     * The doctor workflow identifies a doctor by staffId (falling back to the Mongo id). Resolve whatever
     * the pet-owner UI sent (id, staffId or email) to that canonical value so the booking shows up in the
     * doctor's appointment list and consultations.
     */
    private void resolveDoctor(Appointment a) {
        Optional<Doctor> doctor = Optional.empty();
        if (a.getDoctorId() != null) {
            doctor = doctorRepository.findById(a.getDoctorId());
            if (doctor.isEmpty()) {
                doctor = doctorRepository.findFirstByStaffIdIgnoreCase(a.getDoctorId());
            }
        }
        if (doctor.isEmpty() && a.getDoctorEmail() != null) {
            doctor = doctorRepository.findFirstByEmailIgnoreCase(a.getDoctorEmail());
        }
        if (doctor.isEmpty()) {
            return;
        }
        Doctor d = doctor.get();
        a.setDoctorId(d.getStaffId() != null ? d.getStaffId() : d.getId());
        if (a.getDoctorName() == null) {
            a.setDoctorName(d.getFullName());
        }
        if (a.getDoctorEmail() == null) {
            a.setDoctorEmail(d.getEmail());
        }
        if (a.getSpecialization() == null) {
            a.setSpecialization(d.getSpecialization());
        }
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : String.valueOf(v);
    }

    private static Integer toInteger(Object v) {
        Double d = toDouble(v);
        return d == null ? null : (int) Math.round(d);
    }

    private static Double toDouble(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.doubleValue();
        }
        Matcher matcher = NUMBER.matcher(String.valueOf(v));
        return matcher.find() ? Double.valueOf(matcher.group()) : null;
    }

    private static LocalDateTime toDateTime(Object v) {
        if (v == null) {
            return null;
        }
        String s = String.valueOf(v).trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(s);
        } catch (Exception ignored) {
            // try the next format
        }
        try {
            return OffsetDateTime.parse(s).toLocalDateTime();
        } catch (Exception ignored) {
            // try the next format
        }
        try {
            return LocalDate.parse(s.length() >= 10 ? s.substring(0, 10) : s).atStartOfDay();
        } catch (Exception ignored) {
            return null;
        }
    }
}
