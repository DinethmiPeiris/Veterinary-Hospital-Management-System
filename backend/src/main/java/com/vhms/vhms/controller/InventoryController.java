package com.vhms.vhms.controller;

import com.vhms.vhms.dto.CreateInventoryItemRequest;
import com.vhms.vhms.dto.UpdateInventoryItemRequest;
import com.vhms.vhms.model.InventoryItem;
import com.vhms.vhms.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryItem>> getAllItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        List<InventoryItem> items = inventoryService.getAllItems(category, search);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItem> getItemById(@PathVariable String id) {
        InventoryItem item = inventoryService.getItemById(id);
        return ResponseEntity.ok(item);
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createItem(@Valid @RequestBody CreateInventoryItemRequest request) {
        InventoryItem created = inventoryService.createItem(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> updateItem(
            @PathVariable String id,
            @Valid @RequestBody UpdateInventoryItemRequest request) {
        InventoryItem updated = inventoryService.updateItem(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        inventoryService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
