package com.vhms.vhms.controller;

import com.vhms.vhms.dto.MedicalRecordResponseDTO;
import com.vhms.vhms.dto.WeightUpdateDTO;
import com.vhms.vhms.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/medical-records")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For development
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping("/pet/{petId}")
    public ResponseEntity<MedicalRecordResponseDTO> getMedicalRecordByPetId(@PathVariable String petId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordByPetId(petId));
    }

    @PatchMapping("/pet/{petId}/weight")
    public ResponseEntity<MedicalRecordResponseDTO> updateWeight(
            @PathVariable String petId,
            @Valid @RequestBody WeightUpdateDTO request) {
        return ResponseEntity.ok(medicalRecordService.updateWeight(petId, request.getWeight()));
    }
}
