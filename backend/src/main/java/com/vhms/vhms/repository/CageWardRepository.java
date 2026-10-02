package com.vhms.vhms.repository;

import com.vhms.vhms.model.CageWard;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CageWardRepository extends MongoRepository<CageWard, String> {
    List<CageWard> findByStatus(String status);
    Optional<CageWard> findByCode(String code);
}
