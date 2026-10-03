package com.vhms.vhms.service;

import com.vhms.vhms.dto.CreateInventoryItemRequest;
import com.vhms.vhms.dto.UpdateInventoryItemRequest;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.InventoryItem;
import com.vhms.vhms.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;

    public List<InventoryItem> getAllItems(String category, String search) {
        List<InventoryItem> items;
        if (category != null && !category.trim().isEmpty() && !"ALL".equalsIgnoreCase(category)) {
            items = inventoryItemRepository.findByCategory(category.toUpperCase());
        } else {
            items = inventoryItemRepository.findAll();
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            items = items.stream()
                .filter(item -> (item.getItemName() != null && item.getItemName().toLowerCase().contains(q)) ||
                                (item.getItemCode() != null && item.getItemCode().toLowerCase().contains(q)))
                .toList();
        }

        return items;
    }

    public InventoryItem getItemById(String id) {
        return inventoryItemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with ID: " + id));
    }

    public InventoryItem createItem(CreateInventoryItemRequest request) {
        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new InvalidOperationException("Inventory item quantity cannot be negative.");
        }

        String itemCode = request.getItemCode();
        if (itemCode == null || itemCode.trim().isEmpty()) {
            String prefix = "MEDICINE".equalsIgnoreCase(request.getCategory()) ? "MED" : "SUP";
            long count = inventoryItemRepository.count() + 1;
            itemCode = String.format("%s-%04d", prefix, count);
        }

        InventoryItem item = InventoryItem.builder()
            .itemCode(itemCode)
            .itemName(request.getItemName())
            .category(request.getCategory().toUpperCase())
            .quantity(request.getQuantity())
            .unit(request.getUnit())
            .minimumStockLevel(request.getMinimumStockLevel() != null ? request.getMinimumStockLevel() : 10)
            .build();

        return inventoryItemRepository.save(item);
    }

    public InventoryItem updateItem(String id, UpdateInventoryItemRequest request) {
        InventoryItem existing = getItemById(id);

        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new InvalidOperationException("Inventory item quantity cannot be negative.");
        }

        existing.setItemName(request.getItemName());
        existing.setCategory(request.getCategory().toUpperCase());
        existing.setQuantity(request.getQuantity());
        existing.setUnit(request.getUnit());
        existing.setMinimumStockLevel(request.getMinimumStockLevel() != null ? request.getMinimumStockLevel() : existing.getMinimumStockLevel());

        return inventoryItemRepository.save(existing);
    }

    public void deleteItem(String id) {
        InventoryItem existing = getItemById(id);
        inventoryItemRepository.delete(existing);
    }
}
