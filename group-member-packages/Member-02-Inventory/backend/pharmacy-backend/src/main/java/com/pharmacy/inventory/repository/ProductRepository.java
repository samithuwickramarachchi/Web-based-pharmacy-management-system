package com.pharmacy.inventory.repository;

import com.pharmacy.inventory.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    Optional<Product> findBySku(String sku);
    List<Product> findByCategoryId(Integer categoryId);
    List<Product> findByManufacturerId(Integer manufacturerId);
    List<Product> findByIsActiveTrue();
    List<Product> findByRequiresPrescription(Boolean requiresPrescription);
    boolean existsBySku(String sku);
}
