package com.pharmacy.customer.repository;

import com.pharmacy.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByUserId(Integer userId);
    Optional<Customer> findByMembershipId(String membershipId);
    boolean existsByMembershipId(String membershipId);

    Page<Customer> findByUserIsActiveTrue(Pageable pageable);

    List<Customer> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    List<Customer> findByPhoneContaining(String phone);

    List<Customer> findByMembershipIdContainingIgnoreCase(String membershipId);

    @Query("SELECT c FROM Customer c WHERE " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "c.phone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(c.membershipId) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Customer> searchGeneral(@Param("query") String query);

    @Query("SELECT c FROM Customer c WHERE c.user.isActive = true AND (" +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "c.phone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(c.membershipId) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Customer> searchGeneralActive(@Param("query") String query);
}
