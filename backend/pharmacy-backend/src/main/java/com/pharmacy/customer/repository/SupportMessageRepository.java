package com.pharmacy.customer.repository;

import com.pharmacy.customer.entity.SupportMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Integer> {
    List<SupportMessage> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);
    Page<SupportMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
