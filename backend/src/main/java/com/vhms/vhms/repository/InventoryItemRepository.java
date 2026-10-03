package com.vhms.vhms.repository;

import com.vhms.vhms.model.InventoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends MongoRepository<InventoryItem, String> {
    List<InventoryItem> findByCategory(String category);
    Optional<InventoryItem> findByItemCode(String itemCode);
}
