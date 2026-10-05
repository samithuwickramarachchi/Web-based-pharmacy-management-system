package com.pharmacy.supplier.repository;

import com.pharmacy.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    Optional<Supplier> findByName(String name);
    List<Supplier> findByIsActiveTrue();
    boolean existsByName(String name);
}
