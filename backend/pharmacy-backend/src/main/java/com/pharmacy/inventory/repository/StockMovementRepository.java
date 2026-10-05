package com.pharmacy.inventory.repository;

import com.pharmacy.inventory.entity.StockMovement;
import com.pharmacy.inventory.entity.StockMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductId(Integer productId);
    List<StockMovement> findByBatchId(Integer batchId);
    List<StockMovement> findByMovementType(StockMovementType movementType);
    List<StockMovement> findByReferenceTypeAndReferenceId(String referenceType, Integer referenceId);
}
