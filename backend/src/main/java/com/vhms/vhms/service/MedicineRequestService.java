package com.vhms.vhms.service;

import com.vhms.vhms.dto.CreateMedicineRequestDto;
import com.vhms.vhms.dto.MarkUnavailableRequest;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Hospitalization;
import com.vhms.vhms.model.InventoryItem;
import com.vhms.vhms.model.MedicineRequest;
import com.vhms.vhms.repository.HospitalizationRepository;
import com.vhms.vhms.repository.InventoryItemRepository;
import com.vhms.vhms.repository.MedicineRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineRequestService {

    private final MedicineRequestRepository medicineRequestRepository;
    private final HospitalizationRepository hospitalizationRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public MedicineRequest createRequest(CreateMedicineRequestDto request) {
        Hospitalization hospitalization = hospitalizationRepository.findById(request.getHospitalizationId())
            .orElseThrow(() -> new ResourceNotFoundException("Hospitalization not found with ID: " + request.getHospitalizationId()));

        if ("DISCHARGED".equalsIgnoreCase(hospitalization.getStatus())) {
            throw new InvalidOperationException("Cannot request medicines for a discharged pet.");
        }

        InventoryItem inventoryItem = inventoryItemRepository.findById(request.getInventoryItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with ID: " + request.getInventoryItemId()));

        if (request.getRequestedQuantity() == null || request.getRequestedQuantity() <= 0) {
            throw new InvalidOperationException("Requested quantity must be greater than zero.");
        }

        MedicineRequest medicineRequest = MedicineRequest.builder()
            .hospitalizationId(hospitalization.getId())
            .petId(hospitalization.getPetId())
            .petName(hospitalization.getPetName())
            .doctorId(request.getDoctorId() != null ? request.getDoctorId() : hospitalization.getDoctorId())
            .doctorName(request.getDoctorName() != null ? request.getDoctorName() : hospitalization.getDoctorName())
            .inventoryItemId(inventoryItem.getId())
            .itemCode(inventoryItem.getItemCode())
            .itemName(inventoryItem.getItemName())
            .category(inventoryItem.getCategory())
            .requestedQuantity(request.getRequestedQuantity())
            .unit(inventoryItem.getUnit())
            .instructions(request.getInstructions() != null ? request.getInstructions().trim() : "")
            .status("PENDING")
            .requestedAt(LocalDateTime.now())
            .build();

        return medicineRequestRepository.save(medicineRequest);
    }

    public List<MedicineRequest> getAllRequests(String status) {
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            return medicineRequestRepository.findByStatus(status.trim().toUpperCase());
        }
        return medicineRequestRepository.findAll();
    }

    public List<MedicineRequest> getRequestsByHospitalization(String hospitalizationId) {
        return medicineRequestRepository.findByHospitalizationId(hospitalizationId);
    }

    public MedicineRequest getRequestById(String id) {
        return medicineRequestRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Medicine request not found with ID: " + id));
    }

    public synchronized MedicineRequest issueRequest(String id, String adminId) {
        MedicineRequest request = getRequestById(id);

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new InvalidOperationException("Only PENDING requests can be issued. Current status: " + request.getStatus());
        }

        InventoryItem inventoryItem = inventoryItemRepository.findById(request.getInventoryItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with ID: " + request.getInventoryItemId()));

        int currentStock = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
        int requested = request.getRequestedQuantity() != null ? request.getRequestedQuantity() : 0;

        if (currentStock < requested) {
            throw new InvalidOperationException("Insufficient stock available.");
        }

        // 1. Deduct stock safely
        inventoryItem.setQuantity(currentStock - requested);
        inventoryItemRepository.save(inventoryItem);

        // 2. Mark request as ISSUED
        request.setStatus("ISSUED");
        request.setIssuedAt(LocalDateTime.now());
        request.setIssuedBy(adminId != null ? adminId : "ADMIN-01");

        return medicineRequestRepository.save(request);
    }

    public MedicineRequest markUnavailable(String id, MarkUnavailableRequest request) {
        MedicineRequest medicineRequest = getRequestById(id);

        if (!"PENDING".equalsIgnoreCase(medicineRequest.getStatus())) {
            throw new InvalidOperationException("Only PENDING requests can be marked unavailable. Current status: " + medicineRequest.getStatus());
        }

        medicineRequest.setStatus("UNAVAILABLE");
        medicineRequest.setUnavailableReason(request != null && request.getReason() != null && !request.getReason().trim().isEmpty()
            ? request.getReason().trim()
            : "Requested item is out of stock or unavailable.");
        medicineRequest.setUnavailableAt(LocalDateTime.now());

        return medicineRequestRepository.save(medicineRequest);
    }
}
