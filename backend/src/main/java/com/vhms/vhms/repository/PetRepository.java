package com.vhms.vhms.repository;

import com.vhms.vhms.model.Pet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetRepository extends MongoRepository<Pet, String> {
    List<Pet> findByOwnerId(String ownerId);
}
