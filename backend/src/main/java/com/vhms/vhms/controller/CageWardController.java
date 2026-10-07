package com.vhms.vhms.controller;

import com.vhms.vhms.dto.UpdateCageStatusRequest;
import com.vhms.vhms.model.CageWard;
import com.vhms.vhms.service.CageWardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cages")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class CageWardController {

    private final CageWardService cageWardService;

    @GetMapping
    public ResponseEntity<List<CageWard>> getAllCages() {
        return ResponseEntity.ok(cageWardService.getAllCages());
    }

    @GetMapping("/available")
    public ResponseEntity<List<CageWard>> getAvailableCages() {
        return ResponseEntity.ok(cageWardService.getAvailableCages());
    }

    /**
     * Manual cage status update (Admin only).
     *
     * Allowed transitions:
     *   AVAILABLE  -> MAINTENANCE
     *   MAINTENANCE -> AVAILABLE
     *
     * Any attempt to change an OCCUPIED cage is rejected by the service layer.
     * Returns the updated CageWard document on success.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<CageWard> updateCageStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateCageStatusRequest request) {
        CageWard updated = cageWardService.updateCageStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }
}
