package com.pharmacy.sales.repository;

import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OnlineOrderRepository extends JpaRepository<OnlineOrder, Integer> {
    Optional<OnlineOrder> findByOrderNumber(String orderNumber);
    List<OnlineOrder> findByCustomerId(Integer customerId);
    List<OnlineOrder> findByStatus(OrderStatus status);
    boolean existsByOrderNumber(String orderNumber);

    @Query("SELECT o FROM OnlineOrder o WHERE o.customer.id = :customerId " +
           "AND (:start IS NULL OR o.placedAt >= :start) " +
           "AND (:end IS NULL OR o.placedAt <= :end) " +
           "ORDER BY o.placedAt DESC")
    List<OnlineOrder> findByCustomerIdAndDateRange(@Param("customerId") Integer customerId,
                                                  @Param("start") LocalDateTime start,
                                                  @Param("end") LocalDateTime end);
}
