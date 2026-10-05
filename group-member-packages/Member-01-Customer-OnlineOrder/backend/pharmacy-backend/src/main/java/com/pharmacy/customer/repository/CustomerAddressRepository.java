package com.pharmacy.customer.repository;

import com.pharmacy.customer.entity.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Integer> {
    List<CustomerAddress> findByCustomerId(Integer customerId);
    List<CustomerAddress> findByCustomerIdAndIsDefaultTrue(Integer customerId);
    java.util.Optional<CustomerAddress> findByIdAndCustomerId(Integer id, Integer customerId);
}
