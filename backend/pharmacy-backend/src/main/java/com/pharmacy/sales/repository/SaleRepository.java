package com.pharmacy.sales.repository;

import com.pharmacy.sales.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Integer> {
    Optional<Sale> findBySaleNumber(String saleNumber);
    List<Sale> findByCustomerId(Integer customerId);
    List<Sale> findByStaffId(Integer staffId);
    boolean existsBySaleNumber(String saleNumber);
}
