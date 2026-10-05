package com.pharmacy.delivery.repository;

import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Integer> {
    Optional<Delivery> findByOnlineOrderId(Integer onlineOrderId);
    List<Delivery> findByDeliveryPersonnelId(Integer deliveryPersonnelId);
    List<Delivery> findByStatus(DeliveryStatus status);
}
