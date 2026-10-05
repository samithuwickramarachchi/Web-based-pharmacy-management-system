package com.pharmacy.promotion.repository;

import com.pharmacy.promotion.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Integer> {
    List<PromotionUsage> findByPromotionId(Integer promotionId);
    List<PromotionUsage> findByCustomerId(Integer customerId);
    long countByPromotionId(Integer promotionId);
    long countByPromotionIdAndCustomerId(Integer promotionId, Integer customerId);
}
