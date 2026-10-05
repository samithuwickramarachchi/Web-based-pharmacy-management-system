package com.pharmacy.promotion.repository;

import com.pharmacy.promotion.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    Optional<Promotion> findByCouponCode(String couponCode);
    List<Promotion> findByIsActiveTrue();
    List<Promotion> findByIsActiveTrueAndValidFromBeforeAndValidUntilAfter(LocalDateTime from, LocalDateTime until);
    boolean existsByCouponCode(String couponCode);
}
