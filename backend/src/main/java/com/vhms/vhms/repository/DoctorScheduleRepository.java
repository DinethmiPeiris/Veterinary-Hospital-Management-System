package com.vhms.vhms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.DoctorSchedule;

@Repository
public interface DoctorScheduleRepository extends MongoRepository<DoctorSchedule, String> {

    List<DoctorSchedule> findByDoctorId(String doctorId);

    List<DoctorSchedule> findByDoctorIdAndIsActiveTrue(String doctorId);

    Optional<DoctorSchedule> findByDoctorIdAndDayOfWeekIgnoreCaseAndIsActiveTrue(String doctorId, String dayOfWeek);

    List<DoctorSchedule> findAllByDoctorIdAndDayOfWeekIgnoreCaseAndIsActiveTrue(String doctorId, String dayOfWeek);

    Optional<DoctorSchedule> findFirstByDoctorIdAndDayOfWeekIgnoreCase(String doctorId, String dayOfWeek);

    Optional<DoctorSchedule> findFirstByDoctorIdAndDayOfWeekIgnoreCaseAndShiftStartTime(String doctorId, String dayOfWeek, String shiftStartTime);

    List<DoctorSchedule> findByDoctorIdAndDayOfWeekIgnoreCase(String doctorId, String dayOfWeek);

    List<DoctorSchedule> findByDayOfWeekIgnoreCaseAndIsActiveTrue(String dayOfWeek);

    List<DoctorSchedule> findByIsActiveTrue();
}
