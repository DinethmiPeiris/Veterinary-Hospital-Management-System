package com.vhms.vhms.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.vhms.vhms.model.Appointment;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    List<Appointment> findByDoctorIdOrderByAppointmentDateAsc(String doctorId);

    List<Appointment> findAllByOrderByAppointmentDateAsc();

    List<Appointment> findByStatusIgnoreCase(String status);
}
