package com.pharmacy.delivery.repository;

import com.pharmacy.delivery.entity.DeliveryOfficer;
import com.pharmacy.delivery.entity.DeliveryOfficerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryOfficerRepository extends JpaRepository<DeliveryOfficer, Integer> {
    List<DeliveryOfficer> findByStatusOrderByFullNameAsc(DeliveryOfficerStatus status);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Integer id);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Integer id);
}
