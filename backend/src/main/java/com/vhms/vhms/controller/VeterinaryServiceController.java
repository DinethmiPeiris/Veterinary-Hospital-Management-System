package com.vhms.vhms.controller;

import com.vhms.vhms.model.VeterinaryService;
import com.vhms.vhms.repository.VeterinaryServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for veterinary service catalog management (US-E2-24).
 * Public GET endpoints for all users; POST/PUT/DELETE restricted to ADMIN via SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VeterinaryServiceController {

    private final VeterinaryServiceRepository serviceRepository;

    /** Public — list all active services (for booking forms, etc.) */
    @GetMapping
    public ResponseEntity<List<VeterinaryService>> getActiveServices() {
        return ResponseEntity.ok(serviceRepository.findByActiveTrue());
    }

    /** Public — list all services including inactive (admin view) */
    @GetMapping("/all")
    public ResponseEntity<List<VeterinaryService>> getAllServices() {
        return ResponseEntity.ok(serviceRepository.findAll());
    }

    /** Admin — create a new service */
    @PostMapping
    public ResponseEntity<VeterinaryService> createService(@RequestBody VeterinaryService service) {
        service.setId(null); // ensure MongoDB generates the ID
        return ResponseEntity.ok(serviceRepository.save(service));
    }

    /** Admin — update an existing service */
    @PutMapping("/{id}")
    public ResponseEntity<VeterinaryService> updateService(
            @PathVariable String id,
            @RequestBody VeterinaryService updated) {
        return serviceRepository.findById(id).map(existing -> {
            updated.setId(id);
            return ResponseEntity.ok(serviceRepository.save(updated));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Admin — soft-disable a service (set active=false) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateService(@PathVariable String id) {
        return serviceRepository.findById(id).map(service -> {
            service.setActive(false);
            serviceRepository.save(service);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
