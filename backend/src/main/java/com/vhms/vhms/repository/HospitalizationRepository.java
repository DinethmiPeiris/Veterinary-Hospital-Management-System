package com.vhms.vhms.repository;

import com.vhms.vhms.model.Hospitalization;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalizationRepository extends MongoRepository<Hospitalization, String> {
    List<Hospitalization> findByStatus(String status);
    List<Hospitalization> findByStatusIn(List<String> statuses);
    List<Hospitalization> findByPetOwnerId(String petOwnerId);
    Optional<Hospitalization> findByAdmissionId(String admissionId);
    List<Hospitalization> findByPetId(String petId);
}
