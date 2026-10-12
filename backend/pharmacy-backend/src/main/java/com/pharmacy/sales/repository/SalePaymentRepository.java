package com.pharmacy.sales.repository;

import com.pharmacy.sales.entity.SalePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalePaymentRepository extends JpaRepository<SalePayment, Integer> {
    Optional<SalePayment> findBySaleId(Integer saleId);
}
