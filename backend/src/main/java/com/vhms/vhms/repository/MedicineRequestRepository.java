package com.vhms.vhms.repository;

import com.vhms.vhms.model.MedicineRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRequestRepository extends MongoRepository<MedicineRequest, String> {
    List<MedicineRequest> findByStatus(String status);
    List<MedicineRequest> findByHospitalizationId(String hospitalizationId);
    List<MedicineRequest> findByPetId(String petId);
}
