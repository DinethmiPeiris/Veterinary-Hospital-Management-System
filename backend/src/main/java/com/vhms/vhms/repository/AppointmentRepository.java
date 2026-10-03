package com.vhms.vhms.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.Appointment;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    // ---- develop2 ----
    List<Appointment> findByDoctorIdOrderByAppointmentDateAsc(String doctorId);

    List<Appointment> findAllByOrderByAppointmentDateAsc();

    List<Appointment> findByStatusIgnoreCase(String status);

    // ---- IT24101204 ----
    List<Appointment> findByPetOwnerId(String petOwnerId);

    List<Appointment> findByPetOwnerEmail(String petOwnerEmail);

    List<Appointment> findByDoctorId(String doctorId);

    List<Appointment> findByDoctorEmail(String doctorEmail);
}
