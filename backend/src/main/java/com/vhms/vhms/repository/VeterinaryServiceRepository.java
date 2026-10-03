package com.vhms.vhms.repository;

import com.vhms.vhms.model.VeterinaryService;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VeterinaryServiceRepository extends MongoRepository<VeterinaryService, String> {
    List<VeterinaryService> findByActiveTrue();
    List<VeterinaryService> findByCategory(String category);
}
