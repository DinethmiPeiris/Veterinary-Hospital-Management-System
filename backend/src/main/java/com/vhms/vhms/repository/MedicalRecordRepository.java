package com.vhms.vhms.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.MedicalRecord;

@Repository
public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, String> {

    Optional<MedicalRecord> findByPetId(String petId);

    boolean existsByPetId(String petId);
}
