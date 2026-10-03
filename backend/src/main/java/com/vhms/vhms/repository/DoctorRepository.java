package com.vhms.vhms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.Doctor;

@Repository
public interface DoctorRepository extends MongoRepository<Doctor, String> {

    // ---- develop2 ----
    Optional<Doctor> findFirstByEmailIgnoreCase(String email);

    Optional<Doctor> findFirstByStaffIdIgnoreCase(String staffId);

    Optional<Doctor> findFirstByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByStaffIdIgnoreCase(String staffId);

    boolean existsByUsernameIgnoreCase(String username);

    long count();

    // ---- IT24101204 ----
    Optional<Doctor> findByEmail(String email);

    Optional<Doctor> findByStaffId(String staffId);

    boolean existsByEmail(String email);
}
