package com.vhms.vhms.service;

import com.vhms.vhms.dto.PetRequest;
import com.vhms.vhms.model.Pet;
import com.vhms.vhms.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PetService {

    @Autowired
    private PetRepository petRepository;

    public List<Pet> getPetsByOwner(String ownerId) {
        return petRepository.findByOwnerId(ownerId);
    }

    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    public List<Pet> getAllPetsExcludePhoto() {
        return petRepository.findAllExcludePhoto();
    }

    public Optional<Pet> getPetById(String id) {
        return petRepository.findById(id);
    }

    private void validatePetRequest(PetRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Pet data cannot be empty!");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Pet name is required.");
        }
        if (request.getName().trim().length() < 2 || request.getName().trim().length() > 30) {
            throw new IllegalArgumentException("Pet name must be between 2 and 30 characters.");
        }
        if (request.getWeight() <= 0) {
            throw new IllegalArgumentException("Pet weight must be greater than 0 kg.");
        }
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            try {
                java.time.LocalDate dob = java.time.LocalDate.parse(request.getDateOfBirth());
                if (dob.isAfter(java.time.LocalDate.now())) {
                    throw new IllegalArgumentException("Date of birth cannot be in the future.");
                }
            } catch (java.time.format.DateTimeParseException ignored) {
            }
        }
    }

    public Pet addPet(PetRequest request) {
        validatePetRequest(request);
        Pet pet = new Pet(
                request.getOwnerId(),
                request.getName().trim(),
                request.getSpecies(),
                request.getBreed(),
                request.getAge(),
                request.getWeight(),
                request.getGender(),
                request.getPhotoUrl(),
                request.getDateOfBirth());
        return petRepository.save(pet);
    }

    public Pet updatePet(String id, PetRequest request) {
        validatePetRequest(request);
        Optional<Pet> petOpt = petRepository.findById(id);
        if (petOpt.isEmpty()) {
            throw new RuntimeException("Pet not found!");
        }

        Pet pet = petOpt.get();
        if (request.getName() != null)
            pet.setName(request.getName());
        if (request.getSpecies() != null)
            pet.setSpecies(request.getSpecies());
        if (request.getBreed() != null)
            pet.setBreed(request.getBreed());
        if (request.getAge() > 0)
            pet.setAge(request.getAge());
        if (request.getWeight() > 0)
            pet.setWeight(request.getWeight());
        if (request.getGender() != null)
            pet.setGender(request.getGender());
        if (request.getPhotoUrl() != null)
            pet.setPhotoUrl(request.getPhotoUrl());
        if (request.getDateOfBirth() != null)
            pet.setDateOfBirth(request.getDateOfBirth());

        return petRepository.save(pet);
    }

    public boolean deletePet(String id) {
        if (!petRepository.existsById(id)) {
            return false;
        }
        petRepository.deleteById(id);
        return true;
    }
}
