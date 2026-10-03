package com.vhms.vhms.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.appointment.DoctorScheduleRequest;
import com.vhms.vhms.dto.appointment.TimeSlotResponse;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.AppointmentStatus;
import com.vhms.vhms.model.DoctorSchedule;
import com.vhms.vhms.repository.AppointmentRepository;
import com.vhms.vhms.repository.DoctorScheduleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.annotation.PostConstruct;

@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorScheduleService {

    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AppointmentRepository appointmentRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @PostConstruct
    public void initDefaultSchedules() {
        boolean hasOldSeeds = doctorScheduleRepository.findAll().stream()
                .anyMatch(s -> "09:00".equals(s.getShiftStartTime()) || "10:00".equals(s.getShiftStartTime()) || "16:00".equals(s.getShiftEndTime()));

        if (doctorScheduleRepository.count() == 0 || hasOldSeeds) {
            log.info("Seeding real hospital working shifts (11:00-14:00 & 15:00-20:00) into MongoDB...");
            if (hasOldSeeds) {
                doctorScheduleRepository.deleteAll();
            }
            List<DoctorSchedule> initial = Arrays.asList(
                    // Dr. Natasha Silva (DOC-2001) - Morning Shift (11:00 - 14:00)
                    DoctorSchedule.builder().doctorId("DOC-2001").doctorName("Dr. Natasha Silva").doctorSpecialization("Small Animal Specialist")
                            .dayOfWeek("MONDAY").shiftStartTime("11:00").shiftEndTime("14:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2001").doctorName("Dr. Natasha Silva").doctorSpecialization("Small Animal Specialist")
                            .dayOfWeek("WEDNESDAY").shiftStartTime("11:00").shiftEndTime("14:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2001").doctorName("Dr. Natasha Silva").doctorSpecialization("Small Animal Specialist")
                            .dayOfWeek("FRIDAY").shiftStartTime("11:00").shiftEndTime("14:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2001").doctorName("Dr. Natasha Silva").doctorSpecialization("Small Animal Specialist")
                            .dayOfWeek("SATURDAY").shiftStartTime("11:00").shiftEndTime("14:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),

                    // Dr. Rohan Fernando (DOC-2002) - Morning & Evening Surgeon Shifts
                    DoctorSchedule.builder().doctorId("DOC-2002").doctorName("Dr. Rohan Fernando").doctorSpecialization("Veterinary Surgeon")
                            .dayOfWeek("TUESDAY").shiftStartTime("11:00").shiftEndTime("14:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2002").doctorName("Dr. Rohan Fernando").doctorSpecialization("Veterinary Surgeon")
                            .dayOfWeek("TUESDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2002").doctorName("Dr. Rohan Fernando").doctorSpecialization("Veterinary Surgeon")
                            .dayOfWeek("THURSDAY").shiftStartTime("11:00").shiftEndTime("14:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2002").doctorName("Dr. Rohan Fernando").doctorSpecialization("Veterinary Surgeon")
                            .dayOfWeek("THURSDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2002").doctorName("Dr. Rohan Fernando").doctorSpecialization("Veterinary Surgeon")
                            .dayOfWeek("SATURDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2002").doctorName("Dr. Rohan Fernando").doctorSpecialization("Veterinary Surgeon")
                            .dayOfWeek("SUNDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),

                    // Dr. Sanduni Perera (DOC-2003) - Evening Shift (15:00 - 20:00)
                    DoctorSchedule.builder().doctorId("DOC-2003").doctorName("Dr. Sanduni Perera").doctorSpecialization("Feline & Canine Medicine")
                            .dayOfWeek("SUNDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2003").doctorName("Dr. Sanduni Perera").doctorSpecialization("Feline & Canine Medicine")
                            .dayOfWeek("MONDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2003").doctorName("Dr. Sanduni Perera").doctorSpecialization("Feline & Canine Medicine")
                            .dayOfWeek("WEDNESDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build(),
                    DoctorSchedule.builder().doctorId("DOC-2003").doctorName("Dr. Sanduni Perera").doctorSpecialization("Feline & Canine Medicine")
                            .dayOfWeek("FRIDAY").shiftStartTime("15:00").shiftEndTime("20:00").slotDurationMinutes(30).maxCapacityPerSlot(1).isActive(true).build()
            );
            doctorScheduleRepository.saveAll(initial);
            log.info("Successfully seeded {} official hospital doctor schedule shifts.", initial.size());
        }
    }

    public DoctorSchedule saveSchedule(DoctorScheduleRequest request) {
        Optional<DoctorSchedule> existing = Optional.empty();
        if (request.getShiftStartTime() != null) {
            existing = doctorScheduleRepository.findFirstByDoctorIdAndDayOfWeekIgnoreCaseAndShiftStartTime(
                    request.getDoctorId(), request.getDayOfWeek(), request.getShiftStartTime());
        }
        if (existing.isEmpty()) {
            existing = doctorScheduleRepository.findFirstByDoctorIdAndDayOfWeekIgnoreCase(
                    request.getDoctorId(), request.getDayOfWeek());
        }

        DoctorSchedule schedule = existing.orElseGet(DoctorSchedule::new);
        schedule.setDoctorId(request.getDoctorId());
        schedule.setDoctorName(request.getDoctorName());
        schedule.setDoctorSpecialization(request.getDoctorSpecialization());
        schedule.setDayOfWeek(request.getDayOfWeek().toUpperCase());
        schedule.setShiftStartTime(request.getShiftStartTime());
        schedule.setShiftEndTime(request.getShiftEndTime());
        schedule.setSlotDurationMinutes(request.getSlotDurationMinutes() != null && request.getSlotDurationMinutes() > 0 ? request.getSlotDurationMinutes() : 30);
        schedule.setMaxCapacityPerSlot(request.getMaxCapacityPerSlot() != null && request.getMaxCapacityPerSlot() > 0 ? request.getMaxCapacityPerSlot() : 1);
        schedule.setBlockedDates(request.getBlockedDates() != null ? request.getBlockedDates() : new ArrayList<>());
        schedule.setActive(request.getIsActive() != null ? request.getIsActive() : true);

        return doctorScheduleRepository.save(schedule);
    }

    public List<DoctorSchedule> getSchedulesByDoctor(String doctorId) {
        return doctorScheduleRepository.findByDoctorId(doctorId);
    }

    public List<DoctorSchedule> getAllSchedules() {
        return doctorScheduleRepository.findAll();
    }

    public void deleteSchedule(String scheduleId) {
        doctorScheduleRepository.deleteById(scheduleId);
    }

    public List<TimeSlotResponse> getAvailableSlots(String doctorId, String dateString) {
        List<TimeSlotResponse> slots = new ArrayList<>();

        try {
            LocalDate date = LocalDate.parse(dateString);
            String dayOfWeek = date.getDayOfWeek().name();

            List<DoctorSchedule> schedules = doctorScheduleRepository
                    .findAllByDoctorIdAndDayOfWeekIgnoreCaseAndIsActiveTrue(doctorId, dayOfWeek);

            if (schedules == null || schedules.isEmpty()) {
                // Doctor is not scheduled / off-duty on this day of week
                log.info("Doctor {} is off-duty on {} ({})", doctorId, dayOfWeek, dateString);
                return slots;
            }

            List<AppointmentStatus> activeStatuses = Arrays.asList(
                    AppointmentStatus.REQUESTED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.RESCHEDULED,
                    AppointmentStatus.IN_PROGRESS
            );

            for (DoctorSchedule schedule : schedules) {
                if (!schedule.isActive()) {
                    continue;
                }
                if (schedule.getBlockedDates() != null && schedule.getBlockedDates().contains(dateString)) {
                    continue;
                }

                String startTimeStr = schedule.getShiftStartTime();
                String endTimeStr = schedule.getShiftEndTime();
                int slotDuration = schedule.getSlotDurationMinutes() > 0 ? schedule.getSlotDurationMinutes() : 30;

                LocalTime start = LocalTime.parse(startTimeStr, TIME_FORMATTER);
                LocalTime end = LocalTime.parse(endTimeStr, TIME_FORMATTER);

                while (start.plusMinutes(slotDuration).isBefore(end) || start.plusMinutes(slotDuration).equals(end)) {
                    LocalTime next = start.plusMinutes(slotDuration);
                    String slotStr = start.format(TIME_FORMATTER) + " - " + next.format(TIME_FORMATTER);

                    boolean isBooked = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
                            doctorId,
                            dateString,
                            slotStr,
                            activeStatuses
                    );

                    slots.add(TimeSlotResponse.builder()
                            .timeSlot(slotStr)
                            .startTime(start.format(TIME_FORMATTER))
                            .endTime(next.format(TIME_FORMATTER))
                            .isAvailable(!isBooked)
                            .doctorId(doctorId)
                            .date(dateString)
                            .build());

                    start = next;
                }
            }

        } catch (Exception e) {
            log.error("Error generating time slots for doctor {} on date {}: {}", doctorId, dateString, e.getMessage());
        }

        return slots;
    }
}
