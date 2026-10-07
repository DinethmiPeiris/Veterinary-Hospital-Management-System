package com.vhms.vhms.controller;

import com.vhms.vhms.dto.CreateMedicineRequestDto;
import com.vhms.vhms.dto.MarkUnavailableRequest;
import com.vhms.vhms.model.MedicineRequest;
import com.vhms.vhms.service.MedicineRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medicine-requests")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class MedicineRequestController {

    private final MedicineRequestService medicineRequestService;

    @PostMapping
    public ResponseEntity<MedicineRequest> createRequest(@Valid @RequestBody CreateMedicineRequestDto request) {
        MedicineRequest created = medicineRequestService.createRequest(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<MedicineRequest>> getAllRequests(
            @RequestParam(required = false) String status) {
        List<MedicineRequest> list = medicineRequestService.getAllRequests(status);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/hospitalization/{hospitalizationId}")
    public ResponseEntity<List<MedicineRequest>> getRequestsByHospitalization(
            @PathVariable String hospitalizationId) {
        List<MedicineRequest> list = medicineRequestService.getRequestsByHospitalization(hospitalizationId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicineRequest> getRequestById(@PathVariable String id) {
        MedicineRequest item = medicineRequestService.getRequestById(id);
        return ResponseEntity.ok(item);
    }

    @PatchMapping("/{id}/issue")
    public ResponseEntity<MedicineRequest> issueRequest(
            @PathVariable String id,
            @RequestParam(required = false) String adminId) {
        MedicineRequest updated = medicineRequestService.issueRequest(id, adminId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/unavailable")
    public ResponseEntity<MedicineRequest> markUnavailable(
            @PathVariable String id,
            @RequestBody(required = false) MarkUnavailableRequest request) {
        MedicineRequest updated = medicineRequestService.markUnavailable(id, request);
        return ResponseEntity.ok(updated);
    }
}
