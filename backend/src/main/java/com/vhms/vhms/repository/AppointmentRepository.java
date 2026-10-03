package com.vhms.vhms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.AppointmentStatus;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    Optional<Appointment> findByAppointmentNumber(String appointmentNumber);

    List<Appointment> findByAppointmentNumberStartingWith(String prefix);

    List<Appointment> findByOwnerIdOrderByAppointmentDateDesc(String ownerId);

    List<Appointment> findByOwnerIdAndStatus(String ownerId, AppointmentStatus status);

    List<Appointment> findByDoctorIdAndAppointmentDate(String doctorId, String appointmentDate);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatus(String doctorId, String appointmentDate, AppointmentStatus status);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(String doctorId);

    List<Appointment> findByAppointmentDate(String appointmentDate);

    List<Appointment> findByStatus(AppointmentStatus status);

    boolean existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusIn(
        String doctorId,
        String appointmentDate,
        String timeSlot,
        List<AppointmentStatus> statuses
    );

    long countByDoctorIdAndStatus(String doctorId, AppointmentStatus status);
    
    long countByStatus(AppointmentStatus status);
}
