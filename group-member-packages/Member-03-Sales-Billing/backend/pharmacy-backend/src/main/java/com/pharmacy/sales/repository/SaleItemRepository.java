package com.pharmacy.sales.repository;

import com.pharmacy.sales.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Integer> {
    List<SaleItem> findBySaleId(Integer saleId);
    List<SaleItem> findByProductId(Integer productId);
}
