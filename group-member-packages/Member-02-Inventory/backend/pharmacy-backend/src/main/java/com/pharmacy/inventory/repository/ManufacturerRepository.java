package com.pharmacy.inventory.repository;

import com.pharmacy.inventory.entity.Manufacturer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ManufacturerRepository extends JpaRepository<Manufacturer, Integer> {
    Optional<Manufacturer> findByName(String name);
    boolean existsByName(String name);
}
