package com.pharmacy.sales.repository;

import com.pharmacy.sales.entity.Prescription;
import com.pharmacy.sales.entity.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    Optional<Prescription> findByOnlineOrderId(Integer onlineOrderId);
    List<Prescription> findByCustomerId(Integer customerId);
    List<Prescription> findByStatus(PrescriptionStatus status);
}
