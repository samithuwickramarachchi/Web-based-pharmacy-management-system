package com.pharmacy.sales.repository;

import com.pharmacy.sales.entity.Payment;
import com.pharmacy.sales.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByOnlineOrderId(Integer onlineOrderId);
    Optional<Payment> findByTransactionReference(String transactionReference);
    List<Payment> findByStatus(PaymentStatus status);
}
