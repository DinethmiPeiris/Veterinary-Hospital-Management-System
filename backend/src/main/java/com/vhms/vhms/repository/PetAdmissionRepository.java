package com.vhms.vhms.repository;

import com.vhms.vhms.model.PetAdmission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetAdmissionRepository extends MongoRepository<PetAdmission, String> {
    List<PetAdmission> findByStatus(String status);
    List<PetAdmission> findByPetOwnerId(String petOwnerId);
    List<PetAdmission> findByPetOwnerIdAndStatus(String petOwnerId, String status);
    List<PetAdmission> findByDoctorId(String doctorId);
}
