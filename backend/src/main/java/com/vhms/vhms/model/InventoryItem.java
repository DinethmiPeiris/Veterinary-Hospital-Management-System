package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "inventory_items")
public class InventoryItem {

    @Id
    private String id;
    private String itemCode;
    private String itemName;
    // Category: MEDICINE, MEDICAL_SUPPLY
    private String category;
    private Integer quantity;
    private String unit;
    private Integer minimumStockLevel;
}
