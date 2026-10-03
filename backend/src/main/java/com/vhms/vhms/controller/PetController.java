package com.vhms.vhms.controller;

import com.vhms.vhms.dto.PetRequest;
import com.vhms.vhms.model.Pet;
import com.vhms.vhms.service.PetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets")
@CrossOrigin(origins = "*")
public class PetController {

    @Autowired
    private PetService petService;

    @GetMapping
    public ResponseEntity<List<Pet>> getPetsByOwner(@RequestParam(required = false) String ownerId) {
        if (ownerId != null && !ownerId.isEmpty()) {
            return ResponseEntity.ok(petService.getPetsByOwner(ownerId));
        }
        return ResponseEntity.ok(petService.getAllPets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pet> getPetById(@PathVariable String id) {
        return petService.getPetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> addPet(@RequestBody PetRequest request) {
        try {
            return ResponseEntity.status(201).body(petService.addPet(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePet(@PathVariable String id, @RequestBody PetRequest request) {
        try {
            return ResponseEntity.ok(petService.updatePet(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable String id) {
        if (petService.deletePet(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
