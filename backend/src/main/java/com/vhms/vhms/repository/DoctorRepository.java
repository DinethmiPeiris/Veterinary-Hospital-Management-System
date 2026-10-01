package com.vhms.vhms.repository;

import com.vhms.vhms.model.Doctor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorRepository extends MongoRepository<Doctor, String> {
    Optional<Doctor> findByEmail(String email);

    Optional<Doctor> findByStaffId(String staffId);

    boolean existsByEmail(String email);
}
