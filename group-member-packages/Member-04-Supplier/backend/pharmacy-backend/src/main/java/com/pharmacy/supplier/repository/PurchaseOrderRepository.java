package com.pharmacy.supplier.repository;

import com.pharmacy.supplier.entity.PurchaseOrder;
import com.pharmacy.supplier.entity.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    List<PurchaseOrder> findBySupplierId(Integer supplierId);
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);
    boolean existsByPoNumber(String poNumber);
}
