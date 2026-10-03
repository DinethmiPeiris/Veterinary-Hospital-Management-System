package com.vhms.vhms.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.vhms.vhms.model.Doctor;

public interface DoctorRepository extends MongoRepository<Doctor, String> {

    Optional<Doctor> findFirstByEmailIgnoreCase(String email);

    Optional<Doctor> findFirstByStaffIdIgnoreCase(String staffId);

    Optional<Doctor> findFirstByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByStaffIdIgnoreCase(String staffId);

    boolean existsByUsernameIgnoreCase(String username);

    long count();
}
