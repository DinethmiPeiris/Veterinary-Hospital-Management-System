package com.vhms.vhms.service;

import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.CageWard;
import com.vhms.vhms.repository.CageWardRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CageWardService {

    private final CageWardRepository cageWardRepository;

    /**
     * Idempotent initialization of the fixed demonstration accommodation capacity.
     *
     * Fixed capacity: 10 units
     *   - 7 Standard Pet Cages   (STANDARD_PET)
     *   - 2 Intensive Care Units (ICU)
     *   - 1 Isolation Ward       (ISOLATION)
     *
     * Rules:
     *  - Only creates a predefined cage if its cageCode does NOT already exist.
     *  - NEVER overwrites the status of an existing record (preserves OCCUPIED cages).
     *  - NEVER creates new cages during admission processing (that is handled in AdmissionService).
     *  - Safe to call on every application restart (no duplicates will be created).
     */
    @PostConstruct
    public void initPredefinedCagesIfMissing() {
        // Ordered list of all 10 predefined demonstration accommodation units.
        // type STANDARD_PET replaces the old SMALL_PET / LARGE_PET split so that
        // the dropdown label "STANDARD PET" is consistent across all 7 standard cages.
        List<CageWard> predefined = Arrays.asList(
            CageWard.builder().code("CW-101").type("STANDARD_PET").status("AVAILABLE").notes("Standard pet cage").build(),
            CageWard.builder().code("CW-102").type("STANDARD_PET").status("AVAILABLE").notes("Standard pet cage").build(),
            CageWard.builder().code("CW-103").type("STANDARD_PET").status("AVAILABLE").notes("Standard pet cage").build(),
            CageWard.builder().code("CW-104").type("STANDARD_PET").status("AVAILABLE").notes("Standard pet cage").build(),
            CageWard.builder().code("CW-105").type("STANDARD_PET").status("AVAILABLE").notes("Standard pet cage").build(),
            CageWard.builder().code("CW-106").type("STANDARD_PET").status("AVAILABLE").notes("Standard pet cage").build(),
            CageWard.builder().code("CW-107").type("STANDARD_PET").status("AVAILABLE").notes("Standard pet cage").build(),
            CageWard.builder().code("ICU-01").type("ICU").status("AVAILABLE").notes("Intensive care unit with oxygen setup").build(),
            CageWard.builder().code("ICU-02").type("ICU").status("AVAILABLE").notes("Intensive care unit").build(),
            CageWard.builder().code("ISO-01").type("ISOLATION").status("AVAILABLE").notes("Contagious disease isolation ward").build()
        );

        for (CageWard template : predefined) {
            // Only create if this cageCode is not already in the database.
            // findByCode returns Optional<CageWard>; if present, we skip creation
            // to preserve the current status (e.g., OCCUPIED) of that record.
            if (cageWardRepository.findByCode(template.getCode()).isEmpty()) {
                cageWardRepository.save(template);
            }
        }
    }

    public List<CageWard> getAllCages() {
        return cageWardRepository.findAll();
    }

    public List<CageWard> getAvailableCages() {
        return cageWardRepository.findByStatus("AVAILABLE");
    }

    public CageWard getCageById(String id) {
        return cageWardRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cage/Ward not found with ID: " + id));
    }

    /**
     * Manual cage status transition — Admin only.
     *
     * Allowed transitions:
     *   AVAILABLE  -> MAINTENANCE
     *   MAINTENANCE -> AVAILABLE
     *
     * Forbidden:
     *   OCCUPIED -> anything  (OCCUPIED cages are managed exclusively by the hospitalization lifecycle)
     *   any unsupported target status value
     *
     * The cage is re-fetched from the database at operation time so that a stale
     * dashboard cannot accidentally modify a cage that was just assigned to a patient.
     */
    public CageWard updateCageStatus(String id, String requestedStatus) {
        // Validate that the requested status is a manually settable value
        if (!"AVAILABLE".equals(requestedStatus) && !"MAINTENANCE".equals(requestedStatus)) {
            throw new InvalidOperationException(
                "Invalid status '" + requestedStatus + "'. Manual status changes are limited to AVAILABLE or MAINTENANCE.");
        }

        // Re-read from DB — do NOT trust the status that was visible in the UI
        CageWard cage = cageWardRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cage/Ward not found with ID: " + id));

        String currentStatus = cage.getStatus();

        // Block any attempt to touch an OCCUPIED cage
        if ("OCCUPIED".equals(currentStatus)) {
            throw new InvalidOperationException(
                "Cage " + cage.getCode() + " is currently OCCUPIED and cannot be manually changed. " +
                "Occupied cages are released automatically when the pet is discharged.");
        }

        // Enforce only the two allowed manual transitions
        boolean validTransition =
            ("AVAILABLE".equals(currentStatus)    && "MAINTENANCE".equals(requestedStatus)) ||
            ("MAINTENANCE".equals(currentStatus)  && "AVAILABLE".equals(requestedStatus));

        if (!validTransition) {
            throw new InvalidOperationException(
                "Cannot change cage " + cage.getCode() + " from " + currentStatus + " to " + requestedStatus + ". " +
                "Permitted manual transitions: AVAILABLE -> MAINTENANCE and MAINTENANCE -> AVAILABLE.");
        }

        cage.setStatus(requestedStatus);
        return cageWardRepository.save(cage);
    }
}
