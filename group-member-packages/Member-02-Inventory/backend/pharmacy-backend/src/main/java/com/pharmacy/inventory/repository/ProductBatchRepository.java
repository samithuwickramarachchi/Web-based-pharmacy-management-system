package com.pharmacy.inventory.repository;

import com.pharmacy.inventory.entity.ProductBatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Integer> {
    List<ProductBatch> findByProductId(Integer productId);
    List<ProductBatch> findByProductIdAndIsActiveTrue(Integer productId);
    Optional<ProductBatch> findByProductIdAndBatchNumber(Integer productId, String batchNumber);
    List<ProductBatch> findByExpiryDateBeforeAndIsActiveTrue(LocalDate date);
    List<ProductBatch> findByIsActiveTrue();

    /**
     * Authoritative available-stock query: active batches that have not yet expired.
     * Matches the same filter used in OnlineOrderService checkout validation.
     */
    @Query("SELECT b FROM ProductBatch b WHERE b.product.id = :productId AND b.isActive = true " +
           "AND (b.expiryDate IS NULL OR b.expiryDate >= :today)")
    List<ProductBatch> findActiveNonExpiredByProductId(@Param("productId") Integer productId,
                                                       @Param("today") LocalDate today);

    /**
     * Aggregate available stock across ALL products for efficient low-stock reporting.
     * Returns rows: [productId (Integer), totalAvailable (Long)].
     */
    @Query("SELECT b.product.id, SUM(b.quantity) FROM ProductBatch b " +
           "WHERE b.isActive = true AND (b.expiryDate IS NULL OR b.expiryDate >= :today) " +
           "GROUP BY b.product.id")
    List<Object[]> sumAvailableStockPerProduct(@Param("today") LocalDate today);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM ProductBatch b WHERE b.product.id = :productId AND b.isActive = true ORDER BY b.expiryDate ASC, b.id ASC")
    List<ProductBatch> findActiveBatchesForUpdate(@Param("productId") Integer productId);
}
